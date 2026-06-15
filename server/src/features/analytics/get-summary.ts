import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { categories } from "../../db/schema/categories.js";
import { departments } from "../../db/schema/departments.js";
import { authenticate } from "../../common/auth.js";
import { parseAndValidate } from "../../common/validate.js";
import { errorResponseSchema } from "../../common/errors.js";

const summaryQuerySchema = z.object({
  granularity: z.enum(["day", "week", "month"]).default("day"),
});

const analyticsSummarySchema = z
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
    departmentCounts: z.array(
      z.object({
        departmentId: z.uuid().nullable(),
        departmentName: z.string(),
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
  })
  .meta({ id: "AnalyticsSummary" });

export const getSummaryDoc = {
  summary: "System-wide analytics summary",
  tags: ["Analytics"],
  operationId: "getAnalyticsSummary",
  requestParams: {
    query: summaryQuerySchema,
  },
  responses: {
    200: {
      description: "Aggregated report metrics",
      content: {
        "application/json": { schema: analyticsSummarySchema },
      },
    },
    401: {
      description: "Authentication required",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "Admin only",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
} satisfies ZodOpenApiOperationObject;

// Earliest moment a report reached `resolved`, derived from its status-note comments
// (reports have no resolved_at column). Reports are never reopened, so MIN is a safe guard.
const resolvedAt = sql`(SELECT MIN(c.created_at) FROM comments c WHERE c.report_id = ${reports.id} AND c.type = 'status_note' AND c.new_status = 'resolved')`;

const voteCount = sql<number>`(SELECT COUNT(*)::int FROM votes WHERE votes.report_id = ${reports.id})`;

export function getSummary(router: Router) {
  router.get("/summary", authenticate("admin"), async (req, res) => {
    const { granularity } = parseAndValidate(summaryQuerySchema, req.query);

    // Cast the granularity bind param to text so Postgres can resolve the
    // date_trunc(text, timestamp) overload (value is enum-validated above).
    const truncPeriod = sql`DATE_TRUNC(${granularity}::text, ${reports.createdAt})`;

    const [statusRows, categoryRows, departmentRows, trendRows, resolutionRows, topVoted] =
      await Promise.all([
        db
          .select({ status: reports.status, count: sql<number>`COUNT(*)::int` })
          .from(reports)
          .groupBy(reports.status),
        db
          .select({
            categoryId: reports.categoryId,
            categoryName: categories.name,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(reports)
          .innerJoin(categories, eq(reports.categoryId, categories.id))
          .groupBy(reports.categoryId, categories.name),
        db
          .select({
            departmentId: reports.departmentId,
            departmentName: departments.name,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(reports)
          .leftJoin(departments, eq(reports.departmentId, departments.id))
          .groupBy(reports.departmentId, departments.name),
        db
          .select({
            period: sql<Date>`${truncPeriod}`,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(reports)
          // Group/order by select ordinal: the granularity bind param makes the
          // SELECT and GROUP BY expressions non-identical to the planner otherwise.
          .groupBy(sql`1`)
          .orderBy(sql`1`),
        db
          .select({
            averageSeconds: sql<
              number | null
            >`AVG(EXTRACT(EPOCH FROM (${resolvedAt} - ${reports.createdAt})))::float8`,
            resolvedCount: sql<number>`COUNT(${resolvedAt})::int`,
          })
          .from(reports),
        db
          .select({
            id: reports.id,
            title: reports.title,
            status: reports.status,
            voteCount,
          })
          .from(reports)
          .where(sql`${voteCount} > 0`)
          .orderBy(desc(voteCount), desc(reports.createdAt))
          .limit(10),
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
      departmentCounts: departmentRows.map((r) => ({
        departmentId: r.departmentId,
        departmentName: r.departmentName ?? "Unassigned",
        count: r.count,
      })),
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
    });
  });
}
