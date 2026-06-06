import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { listCategories, listCategoriesDoc } from "./list-categories.js";

export const categoriesRouter = Router();

listCategories(categoriesRouter);

export const categoriesPaths = {
  "/categories": {
    get: listCategoriesDoc,
  },
} satisfies ZodOpenApiPathsObject;
