import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "../client.js";
import { comments } from "../schema/comments.js";
import { notifications } from "../schema/notifications.js";
import { reportPhotos } from "../schema/report-photos.js";
import { reports } from "../schema/reports.js";
import { votes } from "../schema/votes.js";
import type { SeedDepartment } from "./departments.js";
import type { SeedReport } from "./reports.js";
import type { SeedUser } from "./users.js";

const DAY = 86_400_000;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Seed self-check failed: ${message}`);
}

export async function runSeedChecks(params: {
  now: Date; reports: SeedReport[]; departments: SeedDepartment[]; users: SeedUser[];
}) {
  const { now, reports: seededReports, departments, users } = params;
  assert(seededReports.filter((report) => report.departmentId === null).length === 5, "exactly five reports must be Unassigned");
  assert(seededReports.filter((report) => !report.intendedUnassigned && report.departmentId === null).length === 0, "an in-polygon report routed to null");

  const departmentById = new Map(departments.map((department) => [department.id, department]));
  for (const report of seededReports.filter((item) => item.departmentId)) {
    assert(departmentById.get(report.departmentId!)?.categories.includes(report.categoryName), `${report.categoryName} is invalid for ${report.departmentName}`);
    assert(report.address === null || report.address.endsWith(report.departmentName!), `address does not match ${report.departmentName}`);
  }
  const reportCountByDepartment = new Map<string, number>();
  for (const report of seededReports) {
    if (report.departmentId) {
      reportCountByDepartment.set(report.departmentId, (reportCountByDepartment.get(report.departmentId) ?? 0) + 1);
    }
  }
  const districtOne = departments.find((department) => department.name === "District 1")!;
  const districtOneCount = reportCountByDepartment.get(districtOne.id) ?? 0;
  assert(
    departments
      .filter((department) => department.id !== districtOne.id)
      .every((department) => districtOneCount > (reportCountByDepartment.get(department.id) ?? 0)),
    "District 1 must be the busiest department",
  );

  const photoCounts = await db.select({ reportId: reportPhotos.reportId, count: sql<number>`count(*)::int` })
    .from(reportPhotos).where(eq(reportPhotos.kind, "before")).groupBy(reportPhotos.reportId);
  assert(photoCounts.length === seededReports.length && photoCounts.every((row) => row.count >= 1), "every report must have a before photo");

  const resolvedAt = sql`(SELECT MIN(c.created_at) FROM comments c WHERE c.report_id = ${reports.id} AND c.type = 'status_note' AND c.new_status = 'resolved')`;
  const statsByWindow = async (startDays: number, endDays: number) => db.select({
    total: sql<number>`count(*)::int`,
    resolved: sql<number>`count(${resolvedAt})::int`,
    avgResolutionSeconds: sql<number | null>`avg(extract(epoch from (${resolvedAt} - ${reports.createdAt})))::float8`,
  }).from(reports).where(and(
    gte(reports.createdAt, new Date(now.getTime() - startDays * DAY)),
    lt(reports.createdAt, new Date(now.getTime() - endDays * DAY)),
  ));
  const [currentWindow, priorWindow] = await Promise.all([
    statsByWindow(30, 0),
    statsByWindow(60, 30),
  ]);
  const currentStats = currentWindow[0]!;
  const priorStats = priorWindow[0]!;
  const currentResolvedCount = currentStats.resolved;
  const priorResolvedCount = priorStats.resolved;
  assert(priorResolvedCount >= 6, "prior analytics window needs at least six resolved reports");
  assert(currentResolvedCount > priorResolvedCount, "current resolution volume must outpace the prior window");
  assert(currentStats.total > priorStats.total, "current report volume must outpace the prior window");
  assert(currentResolvedCount * priorStats.total > priorResolvedCount * currentStats.total, "current resolution rate must outpace the prior window");
  assert(
    currentStats.avgResolutionSeconds !== null
      && priorStats.avgResolutionSeconds !== null
      && currentStats.avgResolutionSeconds < priorStats.avgResolutionSeconds,
    "current average resolution time must improve on the prior window",
  );

  const closedIds = seededReports.filter((report) => report.status === "closed").map((report) => report.id);
  const resolvedClosed = await db.select({ reportId: comments.reportId }).from(comments)
    .where(and(inArray(comments.reportId, closedIds), eq(comments.type, "status_note"), eq(comments.newStatus, "resolved")));
  assert(new Set(resolvedClosed.map((row) => row.reportId)).size === closedIds.length, "every closed report needs a resolved note");

  const discussionCounts = await db.select({
    reportId: comments.reportId,
    count: sql<number>`count(*)::int`,
  }).from(comments).where(eq(comments.type, "discussion")).groupBy(comments.reportId);
  assert(discussionCounts.length < seededReports.length, "some reports must have no discussion comments");
  assert(discussionCounts.every((row) => row.count <= 4), "a report has more than four discussion comments");
  assert(discussionCounts.some((row) => row.count === 4), "at least one report must have a four-comment conversation");
  const interleavedDiscussions = await db.execute(sql`
    SELECT count(DISTINCT d.report_id)::int AS count
    FROM comments d
    WHERE d.type = 'discussion'
      AND EXISTS (
        SELECT 1 FROM comments earlier
        WHERE earlier.report_id = d.report_id
          AND earlier.type = 'status_note'
          AND earlier.created_at < d.created_at
      )
      AND EXISTS (
        SELECT 1 FROM comments later
        WHERE later.report_id = d.report_id
          AND later.type = 'status_note'
          AND later.created_at > d.created_at
      )
  `);
  assert(Number(interleavedDiscussions.rows[0]?.count ?? 0) > 0, "discussion comments must be interleaved with status notes");

  const banned = users.filter((user) => user.role === "citizen" && user.bannedAt);
  assert(banned.length === 1, "exactly one banned citizen is required");
  assert(seededReports.some((report) => report.citizenId === banned[0]!.id), "the banned citizen must own a report");
  const bannedComments = await db.select({ id: comments.id }).from(comments)
    .where(and(eq(comments.authorId, banned[0]!.id), eq(comments.type, "discussion")));
  assert(bannedComments.length >= 3, "the banned citizen must author several discussion comments");
  const [postBanComments, postBanVotes, postBanReports] = await Promise.all([
    db.select({ id: comments.id }).from(comments)
      .where(and(eq(comments.authorId, banned[0]!.id), gte(comments.createdAt, banned[0]!.bannedAt!))),
    db.select({ reportId: votes.reportId }).from(votes)
      .where(and(eq(votes.citizenId, banned[0]!.id), gte(votes.createdAt, banned[0]!.bannedAt!))),
    db.select({ id: reports.id }).from(reports)
      .where(and(eq(reports.citizenId, banned[0]!.id), gte(reports.createdAt, banned[0]!.bannedAt!))),
  ]);
  assert(postBanComments.length === 0 && postBanVotes.length === 0 && postBanReports.length === 0, "a banned citizen has activity after their ban");

  const impossibleUserHistory = await db.execute(sql`
    SELECT count(*)::int AS count
    FROM users u
    WHERE EXISTS (SELECT 1 FROM reports r WHERE r.citizen_id = u.id AND r.created_at < u.created_at)
       OR EXISTS (SELECT 1 FROM comments c WHERE c.author_id = u.id AND c.created_at < u.created_at)
       OR EXISTS (SELECT 1 FROM votes v WHERE v.citizen_id = u.id AND v.created_at < u.created_at)
       OR EXISTS (SELECT 1 FROM subscriptions s WHERE s.citizen_id = u.id AND s.created_at < u.created_at)
  `);
  assert(Number(impossibleUserHistory.rows[0]?.count ?? 0) === 0, "seeded activity predates its user account");

  const staffRows = users.filter((user) => user.role === "staff");
  const staffComments = await db.select({ reportId: comments.reportId, authorId: comments.authorId })
    .from(comments).where(inArray(comments.authorId, staffRows.map((staff) => staff.id)));
  for (const comment of staffComments) {
    const report = seededReports.find((item) => item.id === comment.reportId)!;
    const staff = staffRows.find((item) => item.id === comment.authorId)!;
    assert(report.departmentId !== null, "staff authored an event on an Unassigned report");
    assert(report.departmentId === staff.departmentId, "staff authored a cross-department event");
  }

  const moderationOrdering = await db.execute(sql`
    SELECT count(*)::int AS count
    FROM reports r
    WHERE (r.is_locked OR r.is_hidden)
      AND (
        EXISTS (SELECT 1 FROM votes v WHERE v.report_id = r.id AND v.created_at > r.updated_at)
        OR EXISTS (SELECT 1 FROM comments c WHERE c.report_id = r.id AND c.created_at > r.updated_at)
        OR EXISTS (
          SELECT 1 FROM subscriptions s
          WHERE s.report_id = r.id
            AND s.citizen_id IS DISTINCT FROM r.citizen_id
            AND s.created_at > r.updated_at
        )
      )
  `);
  assert(Number(moderationOrdering.rows[0]?.count ?? 0) === 0, "lock/hide must be the last social event on a moderated report");

  const queueSignals = await db.select({
    recipientId: notifications.recipientId,
    reportId: notifications.reportId,
    createdAt: notifications.createdAt,
    readAt: notifications.readAt,
  }).from(notifications).where(eq(notifications.type, "new_report"));
  assert(new Set(queueSignals.map((signal) => signal.reportId)).size === 2, "queue signals must cover two recent reports");
  const staffIds = new Set(staffRows.map((staff) => staff.id));
  const reportsById = new Map(seededReports.map((report) => [report.id, report]));
  assert(queueSignals.every((signal) => staffIds.has(signal.recipientId)), "queue signals must only target staff");
  assert(queueSignals.every((signal) => signal.readAt === null), "queue signals must be unread");
  assert(queueSignals.every((signal) => signal.createdAt.getTime() === reportsById.get(signal.reportId)?.createdAt.getTime()), "queue signals must share their report creation time");
  const signalsByRecipient = new Map<string, number>();
  for (const signal of queueSignals) {
    signalsByRecipient.set(signal.recipientId, (signalsByRecipient.get(signal.recipientId) ?? 0) + 1);
  }
  assert([...signalsByRecipient.values()].some((count) => count >= 2), "one staff account must receive at least two queue signals");

  const incorrectUpdatedAt = await db.execute(sql`
    SELECT count(*)::int AS count
    FROM reports r
    WHERE r.updated_at IS DISTINCT FROM GREATEST(
      r.created_at,
      COALESCE((SELECT max(c.created_at) FROM comments c WHERE c.report_id = r.id), r.created_at),
      COALESCE((SELECT max(v.created_at) FROM votes v WHERE v.report_id = r.id), r.created_at),
      COALESCE((SELECT max(s.created_at) FROM subscriptions s WHERE s.report_id = r.id), r.created_at),
      COALESCE((SELECT max(n.created_at) FROM notifications n WHERE n.report_id = r.id), r.created_at)
    )
  `);
  assert(Number(incorrectUpdatedAt.rows[0]?.count ?? 0) === 0, "report updatedAt must equal its latest persisted event");
}
