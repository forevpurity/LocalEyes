import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { departments } from "../../db/schema/departments.js";
import { departmentCategories } from "../../db/schema/department-categories.js";
import { categories } from "../../db/schema/categories.js";
import { eq } from "drizzle-orm";
import { errorResponseSchema } from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { departmentCategorySchema, departmentResponse } from "./schemas.js";

export const listDepartmentsDoc = {
  summary: "List all departments with polygons",
  tags: ["Departments"],
  operationId: "listDepartments",
  responses: {
    200: {
      description: "List of departments",
      content: {
        "application/json": { schema: departmentResponse.array() },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function listDepartments(router: Router) {
  router.get("/", authenticate("admin"), async (_req, res) => {
    const depts = await db
      .select({
        id: departments.id,
        name: departments.name,
        polygon: departments.polygon,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
      })
      .from(departments);

    const deptCategories = await db
      .select({
        departmentId: departmentCategories.departmentId,
        id: categories.id,
        name: categories.name,
      })
      .from(departmentCategories)
      .innerJoin(
        categories,
        eq(departmentCategories.categoryId, categories.id),
      );

    const categoryMap = new Map<string, { id: string; name: string }[]>();
    for (const dc of deptCategories) {
      const list = categoryMap.get(dc.departmentId) ?? [];
      list.push({ id: dc.id, name: dc.name });
      categoryMap.set(dc.departmentId, list);
    }

    const result = depts.map((d) => ({
      ...d,
      categories: categoryMap.get(d.id) ?? [],
    }));

    res.json(result);
  });
}
