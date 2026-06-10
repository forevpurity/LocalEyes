import { z } from "zod";

export const citizenListItem = z
  .object({
    id: z.uuid(),
    email: z.string(),
    displayName: z.string(),
    bannedAt: z.string().nullable(),
    createdAt: z.string(),
  })
  .meta({ id: "CitizenListItem" });
