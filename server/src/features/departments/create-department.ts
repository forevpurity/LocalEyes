import { Router } from "express";
import { z } from "zod";
import { eq, sql, inArray } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { departments } from "../../db/schema/departments.js";
import { departmentCategories } from "../../db/schema/department-categories.js";
import { categories } from "../../db/schema/categories.js";
import {
  ConflictError,
  DomainRuleError,
  ValidationError,
} from "../../common/errors.js";
import { errorResponseSchema } from "../../common/errors.js";
import { parseAndValidate } from "../../common/validate.js";
import { authenticate } from "../../common/auth.js";
import { polygonSchema, departmentResponse } from "./schemas.js";

const createDepartmentSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    polygon: polygonSchema,
    categories: z.array(z.uuid()).min(1, "At least one category is required"),
  })
  .meta({ id: "CreateDepartmentRequest" });

export const createDepartmentDoc = {
  summary: "Create a new department",
  tags: ["Departments"],
  operationId: "createDepartment",
  requestBody: {
    content: {
      "application/json": { schema: createDepartmentSchema },
    },
  },
  responses: {
    201: {
      description: "Department created",
      content: {
        "application/json": { schema: departmentResponse },
      },
    },
    400: {
      description: "Validation failed",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    409: {
      description: "Department name already exists",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    422: {
      description:
        "Polygon overlaps with existing department or is self-intersecting",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function createDepartment(router: Router) {
  router.post("/", authenticate("admin"), async (req, res) => {
    const {
      name,
      polygon: ring,
      categories: categoryIds,
    } = parseAndValidate(createDepartmentSchema, req.body);

    const existing = await db.query.departments.findFirst({
      where: eq(departments.name, name),
    });
    if (existing) {
      throw new ConflictError("Department name already exists");
    }

    const foundCategories = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(inArray(categories.id, categoryIds));

    if (foundCategories.length !== categoryIds.length) {
      const foundIds = new Set(foundCategories.map((c) => c.id));
      const missing = categoryIds.filter((id) => !foundIds.has(id));
      throw new ValidationError("Category not found", [
        {
          field: "categories",
          message: `Category IDs not found: ${missing.join(", ")}`,
        },
      ]);
    }

    const wktRing = ring.map((c) => `${c[0]} ${c[1]}`).join(",");
    const wktPolygon = `SRID=4326;POLYGON((${wktRing}))`;

    const validity = await db.execute<{ is_valid: boolean }>(sql`
      SELECT ST_IsValid(${sql.raw(`'${wktPolygon}'::geometry`)}) AS is_valid
    `);

    if (!validity.rows[0]?.is_valid) {
      throw new ValidationError("Polygon is self-intersecting", [
        {
          field: "polygon",
          message: "Polygon boundary cannot cross itself",
        },
      ]);
    }

    const overlapping = await db.execute<{
      id: string;
      name: string;
    }>(sql`
      SELECT id, name FROM departments
      WHERE ST_Intersects(polygon, ${sql.raw(`'${wktPolygon}'::geometry`)})
      AND NOT ST_Touches(polygon, ${sql.raw(`'${wktPolygon}'::geometry`)})
    `);

    if (overlapping.rows.length > 0) {
      throw new DomainRuleError(
        `Department polygon overlaps with '${overlapping.rows[0].name}'`,
      );
    }

    const result = await db.transaction(async (tx) => {
      const [dept] = await tx
        .insert(departments)
        .values({ name, polygon: { coordinates: [ring] } })
        .returning({
          id: departments.id,
          name: departments.name,
          polygon: departments.polygon,
          createdAt: departments.createdAt,
          updatedAt: departments.updatedAt,
        });

      await tx.insert(departmentCategories).values(
        categoryIds.map((categoryId) => ({
          departmentId: dept.id,
          categoryId,
        })),
      );

      return dept;
    });

    res.status(201).json({
      ...result,
      categories: foundCategories,
    });
  });
}
