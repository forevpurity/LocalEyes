import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { listCategories, listCategoriesDoc } from "./list-categories.js";
import { createCategory, createCategoryDoc } from "./create-category.js";
import { getCategory, getCategoryDoc } from "./get-category.js";
import { updateCategory, updateCategoryDoc } from "./update-category.js";
import { deleteCategory, deleteCategoryDoc } from "./delete-category.js";

export const categoriesRouter = Router();

listCategories(categoriesRouter);
createCategory(categoriesRouter);
getCategory(categoriesRouter);
updateCategory(categoriesRouter);
deleteCategory(categoriesRouter);

export const categoriesPaths = {
  "/categories": {
    get: listCategoriesDoc,
    post: createCategoryDoc,
  },
  "/categories/{id}": {
    get: getCategoryDoc,
    patch: updateCategoryDoc,
    delete: deleteCategoryDoc,
  },
} satisfies ZodOpenApiPathsObject;
