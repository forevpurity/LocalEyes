import { Router } from "express";
import { z } from "zod";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { departments } from "../../db/schema/departments.js";
import { departmentCategories } from "../../db/schema/department-categories.js";
import { categories } from "../../db/schema/categories.js";
import { NotFoundError } from "../../common/errors.js";
import { errorResponseSchema } from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { departmentResponse } from "./schemas.js";

export const getDepartmentDoc = {
  summary: "Get a department by ID",
  tags: ["Departments"],
  operationId: "getDepartment",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Department Id" }) }),
  },
  responses: {
    200: {
      description: "Department found",
      content: {
        "application/json": { schema: departmentResponse },
      },
    },
    404: {
      description: "Department not found",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function getDepartment(router: Router) {
  router.get("/:id", authenticate("admin"), async (req, res) => {
    const [dept] = await db
      .select({
        id: departments.id,
        name: departments.name,
        polygon: departments.polygon,
        isActive: departments.isActive,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
      })
      .from(departments)
      .where(eq(departments.id, req.params.id));

    if (!dept) {
      throw new NotFoundError("Department not found");
    }

    const deptCats = await db
      .select({
        id: categories.id,
        name: categories.name,
      })
      .from(departmentCategories)
      .innerJoin(categories, eq(departmentCategories.categoryId, categories.id))
      .where(eq(departmentCategories.departmentId, dept.id));

    res.json({
      ...dept,
      categories: deptCats,
    });
  });
}
