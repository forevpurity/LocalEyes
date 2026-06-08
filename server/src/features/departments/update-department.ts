import { Router } from "express";
import { z } from "zod";
import { eq, sql, inArray, and, ne } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { departments } from "../../db/schema/departments.js";
import { departmentCategories } from "../../db/schema/department-categories.js";
import { categories } from "../../db/schema/categories.js";
import {
  ConflictError,
  DomainRuleError,
  NotFoundError,
  ValidationError,
} from "../../common/errors.js";
import { errorResponseSchema } from "../../common/errors.js";
import { parseAndValidate } from "../../common/validate.js";
import { authenticate } from "../../common/auth.js";
import { polygonSchema, departmentResponse } from "./schemas.js";

const updateDepartmentSchema = z
  .object({
    name: z.string().min(1).optional(),
    polygon: polygonSchema.optional(),
    categories: z.array(z.uuid()).min(1).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  })
  .meta({ id: "UpdateDepartmentRequest" });

export const updateDepartmentDoc = {
  summary: "Update a department",
  tags: ["Departments"],
  operationId: "updateDepartment",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Department Id" }) }),
  },
  requestBody: {
    content: {
      "application/json": { schema: updateDepartmentSchema },
    },
  },
  responses: {
    200: {
      description: "Department updated",
      content: {
        "application/json": { schema: departmentResponse },
      },
    },
    400: {
      description: "Validation failed or empty body",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    404: {
      description: "Department not found",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    409: {
      description: "Duplicate name",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    422: {
      description: "Polygon overlap / self-intersection / reactivation overlap",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function updateDepartment(router: Router) {
  router.patch("/:id", authenticate("admin"), async (req, res) => {
    const { id } = req.params;
    const data = parseAndValidate(updateDepartmentSchema, req.body);

    const [existing] = await db
      .select({
        id: departments.id,
        name: departments.name,
        polygon: departments.polygon,
        isActive: departments.isActive,
      })
      .from(departments)
      .where(eq(departments.id, id));

    if (!existing) {
      throw new NotFoundError("Department not found");
    }

    if (data.name !== undefined) {
      const duplicate = await db.query.departments.findFirst({
        where: and(eq(departments.name, data.name), ne(departments.id, id)),
      });
      if (duplicate) {
        throw new ConflictError("Department name already exists");
      }
    }

    let ring: [number, number][] | undefined;
    if (data.polygon !== undefined) {
      ring = data.polygon;

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
        WHERE id != ${id}
        AND ST_Area(ST_Intersection(polygon, ${sql.raw(`'${wktPolygon}'::geometry`)})) > 0
      `);

      if (overlapping.rows.length > 0) {
        throw new DomainRuleError(
          `Department polygon overlaps with '${overlapping.rows[0].name}'`,
        );
      }
    }

    if (data.isActive === true && !existing.isActive) {
      const overlapping = await db.execute<{
        id: string;
        name: string;
      }>(sql`
        SELECT d2.id, d2.name FROM departments d2, departments d1
        WHERE d1.id = ${id}
        AND d2.id != ${id}
        AND d2.is_active = true
        AND ST_Area(ST_Intersection(d2.polygon, d1.polygon)) > 0
      `);

      if (overlapping.rows.length > 0) {
        throw new DomainRuleError(
          `Cannot reactivate: polygon overlaps with '${overlapping.rows[0].name}'`,
        );
      }
    }

    let foundCategories: { id: string; name: string }[] | undefined;
    if (data.categories !== undefined) {
      foundCategories = await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(inArray(categories.id, data.categories));

      if (foundCategories.length !== data.categories.length) {
        const foundIds = new Set(foundCategories.map((c) => c.id));
        const missing = data.categories.filter((cid) => !foundIds.has(cid));
        throw new ValidationError("Category not found", [
          {
            field: "categories",
            message: `Category IDs not found: ${missing.join(", ")}`,
          },
        ]);
      }
    }

    const updateValues: Record<string, unknown> = {};
    if (data.name !== undefined) updateValues.name = data.name;
    if (data.polygon !== undefined)
      updateValues.polygon = { coordinates: [ring] };
    if (data.isActive !== undefined) updateValues.isActive = data.isActive;

    const result = await db.transaction(async (tx) => {
      let updated: typeof existing & { createdAt: Date; updatedAt: Date };

      if (Object.keys(updateValues).length > 0) {
        [updated] = await tx
          .update(departments)
          .set(updateValues)
          .where(eq(departments.id, id))
          .returning({
            id: departments.id,
            name: departments.name,
            polygon: departments.polygon,
            isActive: departments.isActive,
            createdAt: departments.createdAt,
            updatedAt: departments.updatedAt,
          });
      } else {
        const [dept] = await tx
          .select({
            id: departments.id,
            name: departments.name,
            polygon: departments.polygon,
            isActive: departments.isActive,
            createdAt: departments.createdAt,
            updatedAt: departments.updatedAt,
          })
          .from(departments)
          .where(eq(departments.id, id));
        updated = dept;
      }

      if (data.categories !== undefined) {
        await tx
          .delete(departmentCategories)
          .where(eq(departmentCategories.departmentId, id));

        await tx.insert(departmentCategories).values(
          data.categories.map((categoryId) => ({
            departmentId: id,
            categoryId,
          })),
        );
      }

      return updated;
    });

    const deptCategories =
      foundCategories ??
      (await db
        .select({ id: categories.id, name: categories.name })
        .from(departmentCategories)
        .innerJoin(
          categories,
          eq(departmentCategories.categoryId, categories.id),
        )
        .where(eq(departmentCategories.departmentId, id)));

    res.json({
      ...result,
      categories: deptCategories,
    });
  });
}
