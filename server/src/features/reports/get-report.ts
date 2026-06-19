import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { categories } from "../../db/schema/categories.js";
import { departments } from "../../db/schema/departments.js";
import { users, USER_ROLES } from "../../db/schema/users.js";
import { reportPhotos } from "../../db/schema/report-photos.js";
import { comments } from "../../db/schema/comments.js";
import {
  NotFoundError,
  errorResponseSchema,
} from "../../common/errors.js";
import { optionalAuthenticate } from "../../common/auth.js";
import {
  requireReportVisibleToCitizen,
  getAllowedTransitions,
  anonymizedAuthorName,
  anonymizedAuthorAvatar,
} from "./lib/report-rules.js";
import { enforceStaffScope } from "./lib/enforce-staff-scope.js";
import { reportCoreColumns, shapeReportCore } from "./lib/report-projection.js";
import type { ReportCoreRow } from "./lib/report-projection.js";
import { reportCoreFields } from "./lib/schemas.js";

const commentItemSchema = z.object({
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
});

const reportDetailSchema = z
  .object({
    ...reportCoreFields,
    allowedTransitions: z.array(z.string()),
    comments: z.array(commentItemSchema),
  })
  .meta({ id: "ReportDetailResponse" });

export const getReportDoc = {
  summary: "Get report detail",
  tags: ["Reports"],
  operationId: "getReport",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Report Id" }) }),
  },
  responses: {
    200: {
      description: "Report detail with comments",
      content: {
        "application/json": { schema: reportDetailSchema },
      },
    },
    403: {
      description: "Staff accessing a report outside their department",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    404: {
      description: "Report not found or not visible",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function getReport(router: Router) {
  router.get("/:id", optionalAuthenticate(), async (req, res) => {
    const actor = req.actor ?? null;
    const { id } = req.params;
    const hideName = !actor || actor.role === "citizen";

    const cols = reportCoreColumns(actor);
    const rows = await db
      .select(cols)
      .from(reports)
      .innerJoin(categories, eq(reports.categoryId, categories.id))
      .leftJoin(departments, eq(reports.departmentId, departments.id))
      .leftJoin(users, eq(reports.citizenId, users.id))
      .where(eq(reports.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundError("Report not found");
    }

    const report = rows[0] as ReportCoreRow;

    requireReportVisibleToCitizen(report, actor);

    if (actor?.role === "staff") {
      await enforceStaffScope(actor!, report);
    }

    const [photoRows, commentRows] = await Promise.all([
      db
        .select({ id: reportPhotos.id, url: reportPhotos.url, order: reportPhotos.order, kind: reportPhotos.kind })
        .from(reportPhotos)
        .where(eq(reportPhotos.reportId, id))
        .orderBy(reportPhotos.order),
      db
        .select({
          id: comments.id,
          type: comments.type,
          body: comments.body,
          newStatus: comments.newStatus,
          authorName: hideName ? anonymizedAuthorName : users.displayName,
          authorAvatarUrl: hideName ? anonymizedAuthorAvatar : users.avatarUrl,
          authorRole: users.role,
          authorId: comments.authorId,
          isHidden: comments.isHidden,
          isEdited: comments.isEdited,
          createdAt: comments.createdAt,
        })
        .from(comments)
        .leftJoin(users, eq(comments.authorId, users.id))
        .where(eq(comments.reportId, id))
        .orderBy(comments.createdAt),
    ]);

    const visibleComments = commentRows.map((c) => ({
      id: c.id,
      type: c.type,
      body: c.isHidden && (!actor || actor.role === "citizen") ? null : c.body,
      newStatus: c.newStatus,
      authorName: c.authorName,
      authorAvatarUrl: c.authorAvatarUrl,
      authorRole: c.authorRole,
      isMine: actor != null && c.authorId === actor.id,
      isHidden: c.isHidden,
      isEdited: c.isEdited,
      createdAt: c.createdAt.toISOString(),
    }));

    const core = shapeReportCore(report, actor);
    res.json({
      ...core,
      photos: photoRows,
      allowedTransitions:
        actor?.role === "staff" || actor?.role === "admin"
          ? getAllowedTransitions(report.status, actor.role)
          : [],
      comments: visibleComments,
    });
  });
}
