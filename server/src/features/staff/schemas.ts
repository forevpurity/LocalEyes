import { z } from "zod";

export const staffListItem = z
  .object({
    id: z.uuid(),
    email: z.string(),
    displayName: z.string(),
    departmentId: z.uuid().nullable(),
    departmentName: z.string().nullable(),
    bannedAt: z.string().nullable(),
    createdAt: z.string(),
  })
  .meta({ id: "StaffListItem" });
