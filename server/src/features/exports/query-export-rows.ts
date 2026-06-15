import { eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { categories } from "../../db/schema/categories.js";
import { departments } from "../../db/schema/departments.js";

export interface ExportRow {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  department: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  resolvedAt: string | null;
}

// Shared report dataset for CSV and GeoJSON exports. `resolvedAt` is derived from
// status-note comments since reports have no resolved_at column. Timestamps are
// normalised to ISO strings (raw-SQL values come back as strings, not Dates).
export async function queryExportRows(): Promise<ExportRow[]> {
  const rows = await db
    .select({
      id: reports.id,
      title: reports.title,
      description: reports.description,
      category: categories.name,
      status: reports.status,
      department: departments.name,
      latitude: sql<number>`ST_Y(${reports.location})`,
      longitude: sql<number>`ST_X(${reports.location})`,
      createdAt: reports.createdAt,
      resolvedAt: sql<
        Date | string | null
      >`(SELECT MIN(c.created_at) FROM comments c WHERE c.report_id = ${reports.id} AND c.type = 'status_note' AND c.new_status = 'resolved')`,
    })
    .from(reports)
    .innerJoin(categories, eq(reports.categoryId, categories.id))
    .leftJoin(departments, eq(reports.departmentId, departments.id))
    .orderBy(reports.createdAt);

  return rows.map((r) => ({
    ...r,
    createdAt: toIso(r.createdAt)!,
    resolvedAt: toIso(r.resolvedAt),
  }));
}

function toIso(value: Date | string | null): string | null {
  if (value == null) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
