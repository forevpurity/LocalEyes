import { z } from "zod";

export const categoryResponse = z
  .object({
    id: z.uuid(),
    name: z.string(),
  })
  .meta({ id: "CategoryResponse" });

export const adminCategoryResponse = z
  .object({
    id: z.uuid(),
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ id: "AdminCategoryResponse" });
