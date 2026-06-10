import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports, REPORT_STATUSES } from "../../db/schema/reports.js";
import { comments } from "../../db/schema/comments.js";
import { users } from "../../db/schema/users.js";
import { parseAndValidate } from "../../common/validate.js";
import {
  NotFoundError,
  DomainRuleError,
  ForbiddenError,
  errorResponseSchema,
} from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";

const ALLOWED_TRANSITIONS: Record<string, ReadonlySet<string>> = {
  submitted: new Set(["acknowledged", "rejected"]),
  acknowledged: new Set(["in_progress"]),
  in_progress: new Set(["resolved"]),
  resolved: new Set(["closed"]),
  closed: new Set(),
  rejected: new Set(),
};

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
    isHidden: z.boolean(),
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
          status: true,
          isHidden: true,
          departmentId: true,
        },
      });

      if (!report) {
        throw new NotFoundError("Report not found");
      }

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

      const allowed = ALLOWED_TRANSITIONS[report.status];
      if (!allowed || !allowed.has(data.newStatus)) {
        throw new DomainRuleError(
          `Cannot transition from "${report.status}" to "${data.newStatus}"`,
        );
      }

      const [comment] = await db.transaction(async (tx) => {
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
            createdAt: comments.createdAt,
          });

        return [inserted] as const;
      });

      res.status(201).json({
        id: comment.id,
        type: comment.type,
        body: comment.body,
        newStatus: comment.newStatus,
        authorName: actor.displayName,
        isHidden: comment.isHidden,
        createdAt: comment.createdAt.toISOString(),
      });
    },
  );
}
