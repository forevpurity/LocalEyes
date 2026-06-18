import { sql, and, gte, lt } from "drizzle-orm";
import { reports } from "../../../db/schema/reports.js";
import { z } from "zod";

// ─── window bounds ───

export const CURRENT_START = sql`now() - interval '30 days'`;
export const PRIOR_END = sql`now() - interval '30 days'`;
export const PRIOR_START = sql`now() - interval '60 days'`;

// ─── window filters ───

export function currentWindow() {
  return and(gte(reports.createdAt, CURRENT_START));
}

export function priorWindow() {
  return and(
    gte(reports.createdAt, PRIOR_START),
    lt(reports.createdAt, PRIOR_END),
  );
}

// ─── trend helper ───

export function trend(currentVal: number, priorVal: number): number | null {
  if (priorVal === 0) return null;
  return Math.round(((currentVal - priorVal) / priorVal) * 100);
}

// ─── shared schema ───

export const dashboardKpiSchema = z.object({
  value: z.number(),
  trendPercent: z.number().nullable(),
});
