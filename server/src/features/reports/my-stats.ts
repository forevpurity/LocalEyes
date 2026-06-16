import type { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { authenticate } from "../../common/auth.js";
import { errorResponseSchema } from "../../common/errors.js";

const myStatsResponseSchema = z
  .object({
    totalReports: z.number(),
    statusCounts: z.array(
      z.object({ status: z.string(), count: z.number() }),
    ),
    averageResolution: z.object({
      averageSeconds: z.number().nullable(),
      averageHours: z.number().nullable(),
      resolvedCount: z.number(),
    }),
  })
  .meta({ id: "MyReportStats" });

export const myStatsDoc = {
  summary: "Personal report statistics for the current citizen",
  tags: ["Reports"],
  operationId: "getMyReportStats",
  responses: {
    200: {
      description: "Aggregated stats for the citizen's own reports",
      content: {
        "application/json": { schema: myStatsResponseSchema },
      },
    },
    401: {
      description: "Authentication required",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "Citizen only",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
} satisfies ZodOpenApiOperationObject;

// Earliest moment a report reached `resolved`, derived from status-note comments.
const resolvedAt = sql`(SELECT MIN(c.created_at) FROM comments c WHERE c.report_id = ${reports.id} AND c.type = 'status_note' AND c.new_status = 'resolved')`;

export function myStats(router: Router) {
  router.get("/my-stats", authenticate("citizen"), async (req, res) => {
    const actor = req.actor!;

    const [statusRows, resolutionRows] = await Promise.all([
      db
        .select({
          status: reports.status,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(reports)
        .where(eq(reports.citizenId, actor.id))
        .groupBy(reports.status),
      db
        .select({
          averageSeconds: sql<
            number | null
          >`AVG(EXTRACT(EPOCH FROM (${resolvedAt} - ${reports.createdAt})))::float8`,
          resolvedCount: sql<number>`COUNT(${resolvedAt})::int`,
        })
        .from(reports)
        .where(eq(reports.citizenId, actor.id)),
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
      averageResolution: {
        averageSeconds,
        averageHours: averageSeconds == null ? null : averageSeconds / 3600,
        resolvedCount: resolutionRows[0]?.resolvedCount ?? 0,
      },
    });
  });
}
