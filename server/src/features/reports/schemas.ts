import { z } from "zod";

export const reportResponse = z
  .object({
    id: z.uuid(),
    title: z.string(),
    description: z.string(),
    categoryId: z.uuid(),
    categoryName: z.string(),
    status: z.string(),
    address: z.string().nullable(),
    latitude: z.number(),
    longitude: z.number(),
    departmentId: z.uuid().nullable(),
    photos: z.array(z.object({ url: z.string(), order: z.number() })),
    voteCount: z.number(),
    createdAt: z.string(),
  })
  .meta({ id: "ReportResponse" });
