import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports, REPORT_STATUSES } from "../../db/schema/reports.js";
import { USER_ROLES } from "../../db/schema/users.js";
import { comments } from "../../db/schema/comments.js";
import { parseAndValidate } from "../../common/validate.js";
import {
  NotFoundError,
  errorResponseSchema,
} from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { requireCanTransition } from "./report-rules.js";
import { enforceStaffScope } from "./enforce-staff-scope.js";
import { emitNotifications } from "../notifications/notify.js";
import { createReportEventNotifications } from "./report-notifications.js";

const updateStatusSchema = z
  .object({
    newStatus: z.enum(REPORT_STATUSES),
    body: z
      .string()
      .min(1, "Status change note is required")
      .max(2000, "Note must be at most 2000 characters"),
  })
  .meta({ id: "UpdateStatusRequest" });

const statusNoteResponseSchema = z
  .object({
    id: z.uuid(),
    type: z.enum(["discussion", "status_note"]),
    body: z.string().nullable(),
    newStatus: z.string().nullable(),
    authorName: z.string().nullable(),
    authorRole: z.enum(USER_ROLES).nullable(),
    isMine: z.boolean(),
    isHidden: z.boolean(),
    isEdited: z.boolean(),
    createdAt: z.string(),
  })
  .meta({ id: "StatusNoteResponse" });

export const updateReportStatusDoc = {
  summary: "Change report status",
  tags: ["Reports"],
  operationId: "updateReportStatus",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Report Id" }) }),
  },
  requestBody: {
    required: true,
    content: {
      "application/json": { schema: updateStatusSchema },
    },
  },
  responses: {
    201: {
      description: "Status updated and status note created",
      content: {
        "application/json": { schema: statusNoteResponseSchema },
      },
    },
    403: {
      description: "Staff accessing a report outside their department",
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
      description: "Business rule violated (e.g. terminal status, same status)",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function updateReportStatus(router: Router) {
  router.post(
    "/:id/status",
    authenticate("staff", "admin"),
    async (req, res) => {
      const actor = req.actor!;
      const { id } = req.params;
      const data = parseAndValidate(updateStatusSchema, req.body);

      const report = await db.query.reports.findFirst({
        where: eq(reports.id, id),
        columns: {
          id: true,
          title: true,
          status: true,
          isHidden: true,
          departmentId: true,
        },
      });

      if (!report) {
        throw new NotFoundError("Report not found");
      }

      await enforceStaffScope(actor, report);

      requireCanTransition(report, data.newStatus, actor.role);

      const [comment, notificationRows] = await db.transaction(async (tx) => {
        await tx
          .update(reports)
          .set({ status: data.newStatus })
          .where(eq(reports.id, id));

        const [inserted] = await tx
          .insert(comments)
          .values({
            reportId: id,
            authorId: actor.id,
            body: data.body,
            type: "status_note",
            newStatus: data.newStatus,
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

        const notificationRows = await createReportEventNotifications(tx, {
          kind: "statusChanged",
          reportId: id,
          reportTitle: report.title,
          newStatus: data.newStatus,
          actorId: actor.id,
        });

        return [inserted, notificationRows] as const;
      });

      emitNotifications(notificationRows);

      res.status(201).json({
        id: comment.id,
        type: comment.type,
        body: comment.body,
        newStatus: comment.newStatus,
        authorName: actor.displayName,
        authorRole: actor.role,
        authorAvatarUrl: actor.avatarUrl ?? null,
        isMine: true,
        isHidden: comment.isHidden,
        isEdited: comment.isEdited,
        createdAt: comment.createdAt.toISOString(),
      });
    },
  );
}
