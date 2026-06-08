import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { categories } from "../../db/schema/categories.js";
import { NotFoundError } from "../../common/errors.js";
import { errorResponseSchema } from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { adminCategoryResponse } from "./schemas.js";

export const getCategoryDoc = {
  summary: "Get a category by ID",
  tags: ["Categories"],
  operationId: "getCategory",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Category Id" }) }),
  },
  responses: {
    200: {
      description: "Category found",
      content: {
        "application/json": { schema: adminCategoryResponse },
      },
    },
    404: {
      description: "Category not found",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function getCategory(router: Router) {
  router.get("/:id", authenticate("admin"), async (req, res) => {
    const [category] = await db
      .select({
        id: categories.id,
        name: categories.name,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .where(eq(categories.id, req.params.id));

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    res.json(category);
  });
}
