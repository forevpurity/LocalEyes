import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { desc, eq, and, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { categories } from "../../db/schema/categories.js";
import { users } from "../../db/schema/users.js";
import { comments } from "../../db/schema/comments.js";
import { authenticate } from "../../common/auth.js";
import { parseAndValidate } from "../../common/validate.js";
import { errorResponseSchema } from "../../common/errors.js";

const summaryQuerySchema = z.object({
  granularity: z.enum(["day", "week", "month"]).default("day"),
});

const departmentSummarySchema = z
  .object({
    totalReports: z.number(),
    statusCounts: z.array(
      z.object({ status: z.string(), count: z.number() }),
    ),
    categoryCounts: z.array(
      z.object({
        categoryId: z.uuid(),
        categoryName: z.string(),
        count: z.number(),
      }),
    ),
    reportsOverTime: z.array(
      z.object({ period: z.string(), count: z.number() }),
    ),
    averageResolution: z.object({
      averageSeconds: z.number().nullable(),
      averageHours: z.number().nullable(),
      resolvedCount: z.number(),
    }),
    topVotedReports: z.array(
      z.object({
        id: z.uuid(),
        title: z.string(),
        status: z.string(),
        voteCount: z.number(),
      }),
    ),
    personalStats: z.object({
      reportsResolved: z.number(),
      commentsAdded: z.number(),
    }),
  })
  .meta({ id: "DepartmentSummary" });

export const getDepartmentSummaryDoc = {
  summary: "Department-scoped analytics summary for staff",
  tags: ["Analytics"],
  operationId: "getDepartmentSummary",
  requestParams: {
    query: summaryQuerySchema,
  },
  responses: {
    200: {
      description: "Aggregated report metrics for the staff member's department",
      content: {
        "application/json": { schema: departmentSummarySchema },
      },
    },
    401: {
      description: "Authentication required",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "Staff only",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
} satisfies ZodOpenApiOperationObject;

// Earliest moment a report reached `resolved`, derived from its status-note comments
const resolvedAt = sql`(SELECT MIN(c.created_at) FROM comments c WHERE c.report_id = ${reports.id} AND c.type = 'status_note' AND c.new_status = 'resolved')`;

const voteCount = sql<number>`(SELECT COUNT(*)::int FROM votes WHERE votes.report_id = ${reports.id})`;

export function getDepartmentSummary(router: Router) {
  router.get("/department", authenticate("staff"), async (req, res) => {
    const { granularity } = parseAndValidate(summaryQuerySchema, req.query);

    // Fetch the staff member's department
    const staffUser = await db.query.users.findFirst({
      where: eq(users.id, req.actor!.id),
      columns: { departmentId: true },
    });

    const departmentId = staffUser?.departmentId ?? null;
    if (!departmentId) {
      // Staff with no department — return empty data
      res.json({
        totalReports: 0,
        statusCounts: [],
        categoryCounts: [],
        reportsOverTime: [],
        averageResolution: {
          averageSeconds: null,
          averageHours: null,
          resolvedCount: 0,
        },
        topVotedReports: [],
        personalStats: {
          reportsResolved: 0,
          commentsAdded: 0,
        },
      });
      return;
    }

    const deptFilter = eq(reports.departmentId, departmentId);

    const truncPeriod = sql`DATE_TRUNC(${granularity}::text, ${reports.createdAt})`;

    const [statusRows, categoryRows, trendRows, resolutionRows, topVoted, personal] =
      await Promise.all([
        db
          .select({ status: reports.status, count: sql<number>`COUNT(*)::int` })
          .from(reports)
          .where(deptFilter)
          .groupBy(reports.status),
        db
          .select({
            categoryId: reports.categoryId,
            categoryName: categories.name,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(reports)
          .innerJoin(categories, eq(reports.categoryId, categories.id))
          .where(deptFilter)
          .groupBy(reports.categoryId, categories.name),
        db
          .select({
            period: sql<Date>`${truncPeriod}`,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(reports)
          .where(deptFilter)
          .groupBy(sql`1`)
          .orderBy(sql`1`),
        db
          .select({
            averageSeconds: sql<
              number | null
            >`AVG(EXTRACT(EPOCH FROM (${resolvedAt} - ${reports.createdAt})))::float8`,
            resolvedCount: sql<number>`COUNT(${resolvedAt})::int`,
          })
          .from(reports)
          .where(deptFilter),
        db
          .select({
            id: reports.id,
            title: reports.title,
            status: reports.status,
            voteCount,
          })
          .from(reports)
          .where(and(deptFilter, sql`${voteCount} > 0`))
          .orderBy(desc(voteCount), desc(reports.createdAt))
          .limit(10),
        // Personal stats: reports this staff member resolved + comments they added
        Promise.all([
          db
            .select({ count: sql<number>`COUNT(*)::int` })
            .from(comments)
            .where(
              and(
                eq(comments.authorId, req.actor!.id),
                eq(comments.type, "status_note"),
                eq(comments.newStatus, "resolved"),
              ),
            ),
          db
            .select({ count: sql<number>`COUNT(*)::int` })
            .from(comments)
            .where(
              and(
                eq(comments.authorId, req.actor!.id),
                eq(comments.type, "discussion"),
              ),
            ),
        ]),
      ]);

    const statusCounts = statusRows.map((r) => ({
      status: r.status,
      count: r.count,
    }));
    const totalReports = statusCounts.reduce((sum, r) => sum + r.count, 0);

    const averageSeconds = resolutionRows[0]?.averageSeconds ?? null;

    res.json({
      totalReports,
      statusCounts,
      categoryCounts: categoryRows,
      reportsOverTime: trendRows.map((r) => ({
        period:
          r.period instanceof Date ? r.period.toISOString() : String(r.period),
        count: r.count,
      })),
      averageResolution: {
        averageSeconds,
        averageHours: averageSeconds == null ? null : averageSeconds / 3600,
        resolvedCount: resolutionRows[0]?.resolvedCount ?? 0,
      },
      topVotedReports: topVoted,
      personalStats: {
        reportsResolved: personal[0][0]?.count ?? 0,
        commentsAdded: personal[1][0]?.count ?? 0,
      },
    });
  });
}
