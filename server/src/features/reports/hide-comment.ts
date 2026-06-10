import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { comments } from "../../db/schema/comments.js";
import { users } from "../../db/schema/users.js";
import {
  NotFoundError,
  ForbiddenError,
  errorResponseSchema,
} from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { commentResponse } from "./schemas.js";

export const hideCommentDoc = {
  summary: "Toggle comment visibility",
  tags: ["Reports"],
  operationId: "hideComment",
  requestParams: {
    path: z.object({
      id: z.uuid().meta({ description: "Report Id" }),
      commentId: z.uuid().meta({ description: "Comment Id" }),
    }),
  },
  responses: {
    200: {
      description: "Comment visibility toggled",
      content: {
        "application/json": { schema: commentResponse },
      },
    },
    403: {
      description: "Staff accessing a report outside their department",
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
  },
} satisfies ZodOpenApiOperationObject;

export function hideComment(router: Router) {
  router.patch(
    "/:id/comments/:commentId/hide",
    authenticate("staff", "admin"),
    async (req, res) => {
      const actor = req.actor!;
      const { id, commentId } = req.params;

      const reportRow = await db
        .select({
          isHidden: reports.isHidden,
          departmentId: reports.departmentId,
        })
        .from(reports)
        .where(eq(reports.id, id))
        .limit(1);

      if (reportRow.length === 0) {
        throw new NotFoundError("Report not found");
      }

      const report = reportRow[0];

      if (actor.role === "staff") {
        const staffUser = await db.query.users.findFirst({
          where: eq(users.id, actor.id),
          columns: { departmentId: true },
        });
        if (staffUser?.departmentId !== report.departmentId) {
          throw report.isHidden
            ? new NotFoundError("Report not found")
            : new ForbiddenError(
                "Not allowed to act on reports outside your department",
              );
        }
      }

      const commentRow = await db
        .select({
          id: comments.id,
          isHidden: comments.isHidden,
        })
        .from(comments)
        .where(
          and(eq(comments.id, commentId), eq(comments.reportId, id)),
        )
        .limit(1);

      if (commentRow.length === 0) {
        throw new NotFoundError("Comment not found");
      }

      const comment = commentRow[0];

      await db
        .update(comments)
        .set({ isHidden: !comment.isHidden })
        .where(eq(comments.id, commentId));

      const [updated] = await db
        .select({
          id: comments.id,
          type: comments.type,
          body: comments.body,
          newStatus: comments.newStatus,
          isHidden: comments.isHidden,
          isEdited: comments.isEdited,
          createdAt: comments.createdAt,
          authorId: comments.authorId,
        })
        .from(comments)
        .where(eq(comments.id, commentId))
        .limit(1);

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
