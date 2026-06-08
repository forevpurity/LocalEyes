import { Router } from "express";
import { z } from "zod";
import { eq, and, ne } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { categories } from "../../db/schema/categories.js";
import { ConflictError, NotFoundError } from "../../common/errors.js";
import { errorResponseSchema } from "../../common/errors.js";
import { parseAndValidate } from "../../common/validate.js";
import { authenticate } from "../../common/auth.js";
import { adminCategoryResponse } from "./schemas.js";

const updateCategorySchema = z
  .object({
    name: z.string().min(1, "Name is required"),
  })
  .meta({ id: "UpdateCategoryRequest" });

export const updateCategoryDoc = {
  summary: "Update a category",
  tags: ["Categories"],
  operationId: "updateCategory",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Category Id" }) }),
  },
  requestBody: {
    content: {
      "application/json": { schema: updateCategorySchema },
    },
  },
  responses: {
    200: {
      description: "Category updated",
      content: {
        "application/json": { schema: adminCategoryResponse },
      },
    },
    400: {
      description: "Validation failed",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    404: {
      description: "Category not found",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    409: {
      description: "Category name already exists",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function updateCategory(router: Router) {
  router.patch("/:id", authenticate("admin"), async (req, res) => {
    const { id } = req.params;
    const { name } = parseAndValidate(updateCategorySchema, req.body);

    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, id));

    if (!existing) {
      throw new NotFoundError("Category not found");
    }

    const duplicate = await db.query.categories.findFirst({
      where: and(eq(categories.name, name), ne(categories.id, id)),
    });
    if (duplicate) {
      throw new ConflictError("Category name already exists");
    }

    const [updated] = await db
      .update(categories)
      .set({ name })
      .where(eq(categories.id, id))
      .returning({
        id: categories.id,
        name: categories.name,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      });

    res.json(updated);
  });
}
