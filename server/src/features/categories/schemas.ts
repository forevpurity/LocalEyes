import { z } from "zod";

export const categoryResponse = z
  .object({
    id: z.uuid(),
    name: z.string(),
  })
  .meta({ id: "CategoryResponse" });
