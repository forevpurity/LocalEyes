import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { categories } from "../../db/schema/categories.js";
import { categoryResponse } from "./schemas.js";

export const listCategoriesDoc = {
  summary: "List all categories",
  tags: ["Categories"],
  operationId: "listCategories",
  responses: {
    200: {
      description: "List of categories",
      content: {
        "application/json": { schema: categoryResponse.array() },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function listCategories(router: Router) {
  router.get("/", async (_req, res) => {
    const rows = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories);

    res.json(rows);
  });
}
