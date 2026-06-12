import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { comments } from "../../db/schema/comments.js";
import { parseAndValidate } from "../../common/validate.js";
import {
  NotFoundError,
  errorResponseSchema,
} from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { requireCanCommentOnReport, requireReportVisibleToCitizen } from "./report-rules.js";
import { enforceStaffScope } from "./enforce-staff-scope.js";
import { commentResponse } from "./schemas.js";

const createCommentSchema = z
  .object({
    body: z
      .string()
      .min(1, "Comment body is required")
      .max(2000, "Comment must be at most 2000 characters"),
  })
  .meta({ id: "CreateCommentRequest" });

export const createCommentDoc = {
  summary: "Add a discussion comment to a report",
  tags: ["Reports"],
  operationId: "createComment",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Report Id" }) }),
  },
  requestBody: {
    required: true,
    content: {
      "application/json": { schema: createCommentSchema },
    },
  },
  responses: {
    201: {
      description: "Comment created",
      content: {
        "application/json": { schema: commentResponse },
      },
    },
    403: {
      description:
        "Not allowed (e.g. staff commenting outside their department)",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    404: {
      description: "Report not found",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    422: {
      description: "Business rule violated (e.g. report is locked)",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function createComment(router: Router) {
  router.post(
    "/:id/comments",
    authenticate("citizen", "staff", "admin"),
    async (req, res) => {
      const actor = req.actor!;
      const { id } = req.params;
      const data = parseAndValidate(createCommentSchema, req.body);

      const report = await db.query.reports.findFirst({
        where: eq(reports.id, id),
        columns: {
          id: true,
          isLocked: true,
          isHidden: true,
          citizenId: true,
          departmentId: true,
        },
      });

      if (!report) {
        throw new NotFoundError("Report not found");
      }

      if (actor.role === "citizen") {
        requireReportVisibleToCitizen(report, actor);
      }

      await enforceStaffScope(actor, report);

      requireCanCommentOnReport(report);

      const [comment] = await db
        .insert(comments)
        .values({
          reportId: id,
          authorId: actor.id,
          body: data.body,
          type: "discussion",
        })
        .returning({
          id: comments.id,
          type: comments.type,
          body: comments.body,
          newStatus: comments.newStatus,
          isHidden: comments.isHidden,
          isEdited: comments.isEdited,
          createdAt: comments.createdAt,
        });

      res.status(201).json({
        id: comment.id,
        type: comment.type,
        body: comment.body,
        newStatus: comment.newStatus,
        authorName: actor.displayName,
        isMine: true,
        isHidden: comment.isHidden,
        isEdited: comment.isEdited,
        createdAt: comment.createdAt.toISOString(),
      });
    },
  );
}
