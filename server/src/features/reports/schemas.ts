import { z } from "zod";
import { USER_ROLES } from "../../db/schema/users.js";

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
    photos: z.array(z.object({ url: z.string(), order: z.number(), kind: z.enum(["before", "after"]) })),
    voteCount: z.number(),
    createdAt: z.string(),
  })
  .meta({ id: "ReportResponse" });

export const commentResponse = z
  .object({
    id: z.uuid(),
    type: z.enum(["discussion", "status_note"]),
    body: z.string().nullable(),
    newStatus: z.string().nullable(),
    authorName: z.string().nullable(),
    authorRole: z.enum(USER_ROLES).nullable(),
    authorAvatarUrl: z.string().nullable(),
    isMine: z.boolean(),
    isHidden: z.boolean(),
    isEdited: z.boolean(),
    createdAt: z.string(),
  })
  .meta({ id: "CommentResponse" });
