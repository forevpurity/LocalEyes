import { z } from "zod";

export const citizenListItem = z
  .object({
    id: z.uuid(),
    email: z.string(),
    displayName: z.string(),
    avatarUrl: z.string().nullable(),
    bannedAt: z.string().nullable(),
    createdAt: z.string(),
  })
  .meta({ id: "CitizenListItem" });
