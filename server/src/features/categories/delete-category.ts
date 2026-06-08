import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { categories } from "../../db/schema/categories.js";
import { departmentCategories } from "../../db/schema/department-categories.js";
import { reports } from "../../db/schema/reports.js";
import { NotFoundError, DomainRuleError } from "../../common/errors.js";
import { errorResponseSchema } from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";

export const deleteCategoryDoc = {
  summary: "Delete a category",
  tags: ["Categories"],
  operationId: "deleteCategory",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Category Id" }) }),
  },
  responses: {
    204: {
      description: "Category deleted",
    },
    404: {
      description: "Category not found",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    422: {
      description: "Category is assigned to departments or referenced by existing reports",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function deleteCategory(router: Router) {
  router.delete("/:id", authenticate("admin"), async (req, res) => {
    const { id } = req.params;

    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, id));

    if (!existing) {
      throw new NotFoundError("Category not found");
    }

    const [assigned] = await db
      .select({ departmentId: departmentCategories.departmentId })
      .from(departmentCategories)
      .where(eq(departmentCategories.categoryId, id))
      .limit(1);

    if (assigned) {
      throw new DomainRuleError(
        "Cannot delete category assigned to departments",
      );
    }

    const [referenced] = await db
      .select({ id: reports.id })
      .from(reports)
      .where(eq(reports.categoryId, id))
      .limit(1);

    if (referenced) {
      throw new DomainRuleError(
        "Cannot delete category referenced by existing reports",
      );
    }

    await db.delete(categories).where(eq(categories.id, id));

    res.status(204).end();
  });
}
