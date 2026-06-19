import { z } from "zod";
import { USER_ROLES } from "../../../db/schema/users.js";

export const reportPhotoSchema = z.object({
  id: z.uuid(),
  url: z.string(),
  order: z.number(),
  kind: z.enum(["before", "after"]),
});

// Field shape of the core Report projection (see report-projection.ts).
// `get`/`list` extend this with their own tails (comments / pagination) so the
// three response shapes cannot silently drift.
export const reportCoreFields = {
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
  departmentName: z.string().nullable(),
  citizenName: z.string().nullable(),
  photos: z.array(reportPhotoSchema),
  voteCount: z.number(),
  hasVoted: z.boolean(),
  isHidden: z.boolean(),
  isLocked: z.boolean(),
  isSubscribed: z.boolean(),
  isOwner: z.boolean(),
  createdAt: z.string(),
} as const;

export const reportCoreResponse = z
  .object(reportCoreFields)
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
