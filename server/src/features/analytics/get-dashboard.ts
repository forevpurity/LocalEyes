import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq, sql, and, gte, lte, lt } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { comments } from "../../db/schema/comments.js";
import { departments } from "../../db/schema/departments.js";
import { authenticate } from "../../common/auth.js";
import { errorResponseSchema } from "../../common/errors.js";

// Reuse the resolvedAt subquery from get-summary.ts:81-83
const resolvedAt = sql`(SELECT MIN(c.created_at) FROM comments c WHERE c.report_id = ${reports.id} AND c.type = 'status_note' AND c.new_status = 'resolved')`;

const dashboardKpiSchema = z.object({
  value: z.number(),
  trendPercent: z.number().nullable(),
});

const dashboardDepartmentSchema = z.object({
  departmentId: z.uuid().nullable(),
  departmentName: z.string(),
  open: z.number(),
  resolved: z.number(),
  avgSpeedHours: z.number().nullable(),
});

const dailyVolumeSchema = z.object({
  date: z.string(),
  count: z.number(),
});

const adminDashboardStatsSchema = z
  .object({
    totalReports: dashboardKpiSchema,
    activeUsers: dashboardKpiSchema,
    resolutionRate: dashboardKpiSchema,
    avgResolutionHours: z.object({
      value: z.number().nullable(),
      trendPercent: z.number().nullable(),
    }),
    dailyVolume: z.array(dailyVolumeSchema),
    departments: z.array(dashboardDepartmentSchema),
  })
  .meta({ id: "AdminDashboardStats" });

export const getDashboardDoc = {
  summary: "Admin dashboard KPIs with period-over-period trends",
  tags: ["Analytics"],
  operationId: "getAdminDashboard",
  responses: {
    200: {
      description: "Dashboard KPIs, 30-day volume, and department performance",
      content: {
        "application/json": { schema: adminDashboardStatsSchema },
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

// ─── window helpers ───

const CURRENT_START = sql`now() - interval '30 days'`;
const PRIOR_END = sql`now() - interval '30 days'`;
const PRIOR_START = sql`now() - interval '60 days'`;

function currentWindow() {
  return and(gte(reports.createdAt, CURRENT_START));
}

function priorWindow() {
  return and(
    gte(reports.createdAt, PRIOR_START),
    lt(reports.createdAt, PRIOR_END),
  );
}

// ─── active users: distinct citizenId ∪ authorId ───

function activeUsersInWindow(windowFilter: ReturnType<typeof and>) {
  // citizens who filed a report in the window
  const reportingCitizens = db
    .select({ userId: reports.citizenId })
    .from(reports)
    .where(and(windowFilter, sql`${reports.citizenId} IS NOT NULL`));

  // authors who commented in the window
  const commentingUsers = db
    .select({ userId: comments.authorId })
    .from(comments)
    .where(
      and(
        gte(comments.createdAt, CURRENT_START), // same window bound as reports
        sql`${comments.authorId} IS NOT NULL`,
      ),
    );

  return db
    .select({
      count: sql<number>`COUNT(DISTINCT u)::int`,
    })
    .from(
      sql`(${reportingCitizens.union(commentingUsers)}) AS u`,
    );
}

// Overload for prior window — comments use the prior bounds
function activeUsersInPriorWindow(windowFilter: ReturnType<typeof and>) {
  const reportingCitizens = db
    .select({ userId: reports.citizenId })
    .from(reports)
    .where(and(windowFilter, sql`${reports.citizenId} IS NOT NULL`));

  const commentingUsers = db
    .select({ userId: comments.authorId })
    .from(comments)
    .where(
      and(
        gte(comments.createdAt, PRIOR_START),
        lt(comments.createdAt, PRIOR_END),
        sql`${comments.authorId} IS NOT NULL`,
      ),
    );

  return db
    .select({
      count: sql<number>`COUNT(DISTINCT u)::int`,
    })
    .from(
      sql`(${reportingCitizens.union(commentingUsers)}) AS u`,
    );
}

// ─── trend helper ───

function trend(currentVal: number, priorVal: number): number | null {
  if (priorVal === 0) return null;
  return Math.round(((currentVal - priorVal) / priorVal) * 100);
}

// ─── route ───

export function getDashboard(router: Router) {
  router.get("/dashboard", authenticate("admin"), async (_req, res) => {
    const now = new Date();

    const [
      totalCurrent,
      totalPrior,
      activeCurrent,
      activePrior,
      resolvedCurrent,
      totalInCurrent,
      resolvedPrior,
      totalInPrior,
      avgCurr,
      avgPrior,
      dailyRows,
      deptRows,
    ] = await Promise.all([
      // totalReports current
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(reports)
        .where(currentWindow()),
      // totalReports prior
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(reports)
        .where(priorWindow()),
      // activeUsers current
      activeUsersInWindow(currentWindow()),
      // activeUsers prior
      activeUsersInPriorWindow(priorWindow()),
      // resolved count current
      db
        .select({ count: sql<number>`COUNT(${resolvedAt})::int` })
        .from(reports)
        .where(currentWindow()),
      // total (all reports) in current window (for rate denominator)
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(reports)
        .where(currentWindow()),
      // resolved count prior
      db
        .select({ count: sql<number>`COUNT(${resolvedAt})::int` })
        .from(reports)
        .where(priorWindow()),
      // total in prior window
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(reports)
        .where(priorWindow()),
      // avg resolution current
      db
        .select({
          avgSeconds: sql<
            number | null
          >`AVG(EXTRACT(EPOCH FROM (${resolvedAt} - ${reports.createdAt})))::float8`,
        })
        .from(reports)
        .where(and(currentWindow(), sql`${resolvedAt} IS NOT NULL`)),
      // avg resolution prior
      db
        .select({
          avgSeconds: sql<
            number | null
          >`AVG(EXTRACT(EPOCH FROM (${resolvedAt} - ${reports.createdAt})))::float8`,
        })
        .from(reports)
        .where(and(priorWindow(), sql`${resolvedAt} IS NOT NULL`)),
      // daily volume — last 30 calendar days, grouped by date (UTC)
      db
        .select({
          date: sql<Date>`DATE_TRUNC('day', ${reports.createdAt} AT TIME ZONE 'UTC')`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(reports)
        .where(currentWindow())
        .groupBy(sql`1`)
        .orderBy(sql`1`),
      // department performance
      db
        .select({
          departmentId: reports.departmentId,
          departmentName: departments.name,
          open:
            sql<number>`COUNT(*) FILTER (WHERE ${reports.status} IN ('submitted','acknowledged','in_progress'))::int`,
          // "Ever reached resolved" (matches avgSpeed and the resolution-rate
          // KPI), so a report later moved to `closed` still counts as resolved.
          resolved: sql<number>`COUNT(${resolvedAt})::int`,
          avgSeconds:
            sql<number | null>`AVG(EXTRACT(EPOCH FROM (${resolvedAt} - ${reports.createdAt}))) FILTER (WHERE ${resolvedAt} IS NOT NULL)::float8`,
        })
        .from(reports)
        .leftJoin(departments, eq(reports.departmentId, departments.id))
        .groupBy(reports.departmentId, departments.name)
        .orderBy(sql`2 DESC`),
    ]);

    // ─── build response ───

    const tc = totalCurrent[0]?.count ?? 0;
    const tp = totalPrior[0]?.count ?? 0;

    const ac = activeCurrent[0]?.count ?? 0;
    const ap = activePrior[0]?.count ?? 0;

    const rc = resolvedCurrent[0]?.count ?? 0;
    const rp = resolvedPrior[0]?.count ?? 0;
    const tic = totalInCurrent[0]?.count ?? 0;
    const tip = totalInPrior[0]?.count ?? 0;
    const rateCurr = tic > 0 ? Math.round((rc / tic) * 100) : 0;
    const ratePrior = tip > 0 ? Math.round((rp / tip) * 100) : 0;

    const avgCurrSecs = avgCurr[0]?.avgSeconds ?? null;
    const avgPriorSecs = avgPrior[0]?.avgSeconds ?? null;

    // ─── zero-fill daily volume ───

    const dailyMap = new Map<string, number>();
    for (const r of dailyRows) {
      const d =
        r.date instanceof Date
          ? r.date.toISOString().slice(0, 10)
          : String(r.date).slice(0, 10);
      dailyMap.set(d, r.count);
    }

    const dailyVolume: { date: string; count: number }[] = [];
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyVolume.push({ date: key, count: dailyMap.get(key) ?? 0 });
    }

    // ─── departments ───

    const deptList = deptRows.map((r) => ({
      departmentId: r.departmentId,
      departmentName: r.departmentName ?? "Unassigned",
      open: r.open,
      resolved: r.resolved,
      avgSpeedHours:
        r.avgSeconds != null ? r.avgSeconds / 3600 : null,
    }));

    // Sort by open descending (already by resolved desc from query; final sort in JS)
    deptList.sort((a, b) => b.open - a.open);

    res.json({
      totalReports: { value: tc, trendPercent: trend(tc, tp) },
      activeUsers: { value: ac, trendPercent: trend(ac, ap) },
      resolutionRate: { value: rateCurr, trendPercent: trend(rateCurr, ratePrior) },
      avgResolutionHours: {
        value: avgCurrSecs != null ? avgCurrSecs / 3600 : null,
        trendPercent:
          avgCurrSecs != null && avgPriorSecs != null
            ? trend(avgCurrSecs, avgPriorSecs) // raw trend; frontend inverts for display
            : null,
      },
      dailyVolume,
      departments: deptList,
    });
  });
}
