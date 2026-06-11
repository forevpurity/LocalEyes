import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { comments } from "../../db/schema/comments.js";
import { users } from "../../db/schema/users.js";
import { parseAndValidate } from "../../common/validate.js";
import {
  NotFoundError,
  errorResponseSchema,
} from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { requireCanEditComment } from "./report-rules.js";
import { commentResponse } from "./schemas.js";

const editCommentSchema = z
  .object({
    body: z
      .string()
      .min(1, "Comment body is required")
      .max(2000, "Comment must be at most 2000 characters"),
  })
  .meta({ id: "EditCommentRequest" });

export const editCommentDoc = {
  summary: "Edit a comment",
  tags: ["Reports"],
  operationId: "editComment",
  requestParams: {
    path: z.object({
      id: z.uuid().meta({ description: "Report Id" }),
      commentId: z.uuid().meta({ description: "Comment Id" }),
    }),
  },
  requestBody: {
    required: true,
    content: {
      "application/json": { schema: editCommentSchema },
    },
  },
  responses: {
    200: {
      description: "Comment updated",
      content: {
        "application/json": { schema: commentResponse },
      },
    },
    403: {
      description: "Not the comment owner",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    404: {
      description: "Report or comment not found",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    422: {
      description:
        "Business rule violated (status note, hidden comment, locked report, edit window expired)",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function editComment(router: Router) {
  router.patch(
    "/:id/comments/:commentId",
    authenticate("citizen", "staff", "admin"),
    async (req, res) => {
      const actor = req.actor!;
      const { id, commentId } = req.params;
      const data = parseAndValidate(editCommentSchema, req.body);

      const reportRow = await db
        .select({
          isLocked: reports.isLocked,
          isHidden: reports.isHidden,
          citizenId: reports.citizenId,
        })
        .from(reports)
        .where(eq(reports.id, id))
        .limit(1);

      if (reportRow.length === 0) {
        throw new NotFoundError("Report not found");
      }

      const report = reportRow[0];

      const commentRow = await db
        .select({
          authorId: comments.authorId,
          type: comments.type,
          isHidden: comments.isHidden,
          createdAt: comments.createdAt,
        })
        .from(comments)
        .where(and(eq(comments.id, commentId), eq(comments.reportId, id)))
        .limit(1);

      if (commentRow.length === 0) {
        throw new NotFoundError("Comment not found");
      }

      const comment = commentRow[0];

      requireCanEditComment(report, comment, actor);

      const [updated] = await db
        .update(comments)
        .set({ body: data.body, isEdited: true })
        .where(eq(comments.id, commentId))
        .returning({
          id: comments.id,
          type: comments.type,
          body: comments.body,
          newStatus: comments.newStatus,
          isHidden: comments.isHidden,
          isEdited: comments.isEdited,
          createdAt: comments.createdAt,
          authorId: comments.authorId,
        });

      const authorRow = updated.authorId
        ? await db.query.users.findFirst({
            where: eq(users.id, updated.authorId),
            columns: { displayName: true },
          })
        : null;

      res.json({
        id: updated.id,
        type: updated.type,
        body: updated.body,
        newStatus: updated.newStatus,
        authorName: authorRow?.displayName ?? null,
        isHidden: updated.isHidden,
        isEdited: updated.isEdited,
        createdAt: updated.createdAt.toISOString(),
      });
    },
  );
}
