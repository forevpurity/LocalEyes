import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { categories } from "../../db/schema/categories.js";
import { ConflictError } from "../../common/errors.js";
import { errorResponseSchema } from "../../common/errors.js";
import { parseAndValidate } from "../../common/validate.js";
import { authenticate } from "../../common/auth.js";
import { adminCategoryResponse } from "./schemas.js";

const createCategorySchema = z
  .object({
    name: z.string().min(1, "Name is required"),
  })
  .meta({ id: "CreateCategoryRequest" });

export const createCategoryDoc = {
  summary: "Create a new category",
  tags: ["Categories"],
  operationId: "createCategory",
  requestBody: {
    content: {
      "application/json": { schema: createCategorySchema },
    },
  },
  responses: {
    201: {
      description: "Category created",
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
    409: {
      description: "Category name already exists",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function createCategory(router: Router) {
  router.post("/", authenticate("admin"), async (req, res) => {
    const { name } = parseAndValidate(createCategorySchema, req.body);

    const existing = await db.query.categories.findFirst({
      where: eq(categories.name, name),
    });
    if (existing) {
      throw new ConflictError("Category name already exists");
    }

    const [category] = await db
      .insert(categories)
      .values({ name })
      .returning({
        id: categories.id,
        name: categories.name,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      });

    res.status(201).json(category);
  });
}
