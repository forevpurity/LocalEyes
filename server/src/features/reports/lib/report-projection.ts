import { eq, sql } from "drizzle-orm";
import { db } from "../../../db/client.js";
import { reports } from "../../../db/schema/reports.js";
import { categories } from "../../../db/schema/categories.js";
import { departments } from "../../../db/schema/departments.js";
import { users } from "../../../db/schema/users.js";
import { reportPhotos } from "../../../db/schema/report-photos.js";
import { NotFoundError } from "../../../common/errors.js";
import { anonymizedCitizenName } from "./report-rules.js";
import type { UserRole } from "../../../db/schema/users.js";

export type Actor = { id: string; role: UserRole } | null;

/**
 * Shared Drizzle select-column object for the core Report projection.
 * Every endpoint that returns a Report uses this for the base columns,
 * keeping the joins below identical.
 */
export function reportCoreColumns(actor: Actor) {
  const hideName = !actor || actor.role === "citizen";
  return {
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
    citizenName: hideName ? anonymizedCitizenName : users.displayName,
    voteCount: sql<number>`(SELECT COUNT(*)::int FROM votes WHERE votes.report_id = ${reports.id})`,
    hasVoted:
      actor?.role === "citizen"
        ? sql<boolean>`EXISTS(SELECT 1 FROM votes WHERE votes.report_id = ${reports.id} AND votes.citizen_id = ${actor.id})`
        : sql<boolean>`false`,
    isSubscribed:
      actor?.role === "citizen"
        ? sql<boolean>`EXISTS(SELECT 1 FROM subscriptions WHERE subscriptions.report_id = ${reports.id} AND subscriptions.citizen_id = ${actor.id})`
        : sql<boolean>`false`,
  };
}

export type ReportCoreRow = {
  id: string;
  title: string;
  description: string;
  status: string;
  address: string | null;
  departmentId: string | null;
  isHidden: boolean;
  isLocked: boolean;
  citizenId: string | null;
  createdAt: Date;
  categoryId: string;
  latitude: number;
  longitude: number;
  categoryName: string;
  departmentName: string | null;
  citizenName: string | null;
  voteCount: number;
  hasVoted: boolean;
  isSubscribed: boolean;
};

/**
 * Map a database row (returned by a query using `reportCoreColumns`) into the
 * core Report JSON shape. The caller is responsible for attaching `photos`.
 */
export function shapeReportCore(row: ReportCoreRow, actor: Actor) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    status: row.status,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    departmentId: row.departmentId,
    departmentName: row.departmentName,
    citizenName: row.citizenName,
    voteCount: row.voteCount,
    hasVoted: row.hasVoted,
    isHidden: row.isHidden,
    isLocked: row.isLocked,
    isSubscribed: row.isSubscribed,
    isOwner: actor?.role === "citizen" && row.citizenId === actor.id,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Load a report by id, returning the full core shape with photos.
 * Replaces the old `hydrateReport(id)` — now takes an actor for
 * role-aware field selection (hasVoted, isSubscribed, anonymisation).
 */
export async function getReportForActor(id: string, actor: Actor) {
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

  const photoRows = await db
    .select({ id: reportPhotos.id, url: reportPhotos.url, order: reportPhotos.order, kind: reportPhotos.kind })
    .from(reportPhotos)
    .where(eq(reportPhotos.reportId, id))
    .orderBy(reportPhotos.order);

  const report = shapeReportCore(rows[0] as ReportCoreRow, actor);
  return { ...report, photos: photoRows };
}
