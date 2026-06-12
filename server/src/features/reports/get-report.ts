import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { categories } from "../../db/schema/categories.js";
import { departments } from "../../db/schema/departments.js";
import { users } from "../../db/schema/users.js";
import { reportPhotos } from "../../db/schema/report-photos.js";
import { comments } from "../../db/schema/comments.js";
import { subscriptions } from "../../db/schema/subscriptions.js";
import {
  NotFoundError,
  errorResponseSchema,
} from "../../common/errors.js";
import { optionalAuthenticate } from "../../common/auth.js";
import { requireReportVisibleToCitizen } from "./report-rules.js";
import { enforceStaffScope } from "./enforce-staff-scope.js";

const commentItemSchema = z.object({
  id: z.uuid(),
  type: z.enum(["discussion", "status_note"]),
  body: z.string().nullable(),
  newStatus: z.string().nullable(),
  authorName: z.string().nullable(),
  isHidden: z.boolean(),
  isEdited: z.boolean(),
  createdAt: z.string(),
});

const reportDetailSchema = z
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
    departmentName: z.string().nullable(),
    citizenName: z.string().nullable(),
    photos: z.array(z.object({ url: z.string(), order: z.number() })),
    voteCount: z.number(),
    hasVoted: z.boolean(),
    isOwner: z.boolean(),
    isHidden: z.boolean(),
    isLocked: z.boolean(),
    isSubscribed: z.boolean(),
    createdAt: z.string(),
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

    const row = await db
      .select({
        id: reports.id,
        title: reports.title,
        description: reports.description,
        status: reports.status,
        address: reports.address,
        departmentId: reports.departmentId,
        isHidden: reports.isHidden,
        isLocked: reports.isLocked,
        citizenId: reports.citizenId,
        createdAt: reports.createdAt,
        categoryId: reports.categoryId,
        latitude: sql<number>`ST_Y(${reports.location})`,
        longitude: sql<number>`ST_X(${reports.location})`,
        categoryName: categories.name,
        departmentName: departments.name,
        citizenName: users.displayName,
        voteCount: sql<number>`(SELECT COUNT(*)::int FROM votes WHERE votes.report_id = ${reports.id})`,
        hasVoted:
          actor?.role === "citizen"
            ? sql<boolean>`EXISTS(SELECT 1 FROM votes WHERE votes.report_id = ${reports.id} AND votes.citizen_id = ${actor.id})`
            : sql<boolean>`false`,
        isSubscribed:
          actor?.role === "citizen"
            ? sql<boolean>`EXISTS(SELECT 1 FROM subscriptions WHERE subscriptions.report_id = ${reports.id} AND subscriptions.citizen_id = ${actor.id})`
            : sql<boolean>`false`,
      })
      .from(reports)
      .innerJoin(categories, eq(reports.categoryId, categories.id))
      .leftJoin(departments, eq(reports.departmentId, departments.id))
      .leftJoin(users, eq(reports.citizenId, users.id))
      .where(eq(reports.id, id))
      .limit(1);

    if (row.length === 0) {
      throw new NotFoundError("Report not found");
    }

    const report = row[0];

    requireReportVisibleToCitizen(report, actor);

    if (actor?.role === "staff") {
      await enforceStaffScope(actor!, report);
    }

    const [photoRows, commentRows] = await Promise.all([
      db
        .select({ url: reportPhotos.url, order: reportPhotos.order })
        .from(reportPhotos)
        .where(eq(reportPhotos.reportId, id))
        .orderBy(reportPhotos.order),
      db
        .select({
          id: comments.id,
          type: comments.type,
          body: comments.body,
          newStatus: comments.newStatus,
          authorName: users.displayName,
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
      isHidden: c.isHidden,
      isEdited: c.isEdited,
      createdAt: c.createdAt.toISOString(),
    }));

    res.json({
      id: report.id,
      title: report.title,
      description: report.description,
      categoryId: report.categoryId,
      categoryName: report.categoryName,
      status: report.status,
      address: report.address,
      latitude: report.latitude,
      longitude: report.longitude,
      departmentId: report.departmentId,
      departmentName: report.departmentName,
      citizenName: report.citizenName,
      photos: photoRows,
      voteCount: report.voteCount,
      hasVoted: report.hasVoted,
      isOwner: actor?.role === "citizen" && report.citizenId === actor.id,
      isHidden: report.isHidden,
      isLocked: report.isLocked,
      isSubscribed: report.isSubscribed,
      createdAt: report.createdAt.toISOString(),
      comments: visibleComments,
    });
  });
}
