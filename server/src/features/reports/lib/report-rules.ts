import { sql } from "drizzle-orm";
import {
  DomainRuleError,
  ForbiddenError,
  NotFoundError,
} from "../../../common/errors.js";
import { users } from "../../../db/schema/users.js";
import type { UserRole } from "../../../db/schema/users.js";

type Actor = { id: string; role: UserRole; displayName: string };

// Banned Citizens are anonymised on public-facing report data (CONTEXT.md).
export const anonymizedCitizenName = sql<string | null>`
  CASE WHEN ${users.bannedAt} IS NULL THEN ${users.displayName} ELSE NULL END`;

// The report citizen's avatar obeys the same ban-rule as their name.
export const anonymizedCitizenAvatar = sql<string | null>`
  CASE WHEN ${users.bannedAt} IS NULL THEN ${users.avatarUrl} ELSE NULL END`;

// Comments: only anonymise banned *citizens*; preserve staff/admin authorship
// on status notes for accountability.
export const anonymizedAuthorName = sql<string | null>`
  CASE WHEN ${users.bannedAt} IS NOT NULL AND ${users.role} = 'citizen'
       THEN NULL ELSE ${users.displayName} END`;

// Avatar URL obeys the same ban-rule as author name.
export const anonymizedAuthorAvatar = sql<string | null>`
  CASE WHEN ${users.bannedAt} IS NOT NULL AND ${users.role} = 'citizen'
       THEN NULL ELSE ${users.avatarUrl} END`;

const STAFF_TRANSITIONS: Record<string, ReadonlySet<string>> = {
  submitted: new Set(["acknowledged", "rejected"]),
  acknowledged: new Set(["in_progress"]),
  in_progress: new Set(["resolved"]),
  resolved: new Set(["closed"]),
  closed: new Set(),
  rejected: new Set(),
  withdrawn: new Set(),
};

// Admin correction: reverse a mistaken terminal transition (not a workflow
// reopening). `withdrawn` is the Citizen's own choice and stays terminal.
// See CONTEXT.md "Report Status".
const ADMIN_TRANSITIONS: Record<string, ReadonlySet<string>> = {
  ...Object.fromEntries(
    Object.entries(STAFF_TRANSITIONS).map(([k, v]) => [k, v]),
  ),
  closed: new Set(["acknowledged"]),
  rejected: new Set(["submitted"]),
};

export function getAllowedTransitions(
  status: string,
  role: UserRole,
): string[] {
  const map = role === "admin" ? ADMIN_TRANSITIONS : STAFF_TRANSITIONS;
  return Array.from(map[status] ?? []);
}

function isOwner(report: { citizenId: string | null }, actor: Actor): boolean {
  return report.citizenId === actor.id;
}

function throwVisibilityMask(report: { isHidden: boolean }): never {
  throw report.isHidden
    ? new NotFoundError("Report not found")
    : new ForbiddenError("Not allowed to access reports you do not own");
}

export function requireCanTransition(
  report: { status: string },
  newStatus: string,
  role: UserRole = "staff",
): void {
  const map = role === "admin" ? ADMIN_TRANSITIONS : STAFF_TRANSITIONS;
  const allowed = map[report.status];
  if (!allowed || !allowed.has(newStatus)) {
    throw new DomainRuleError(
      `Cannot transition from "${report.status}" to "${newStatus}"`,
    );
  }
}

export function requireCanEditReport(
  report: { citizenId: string | null; status: string; isLocked: boolean; isHidden: boolean },
  actor: Actor,
): void {
  if (!isOwner(report, actor)) throwVisibilityMask(report);
  if (report.status !== "submitted") {
    throw new DomainRuleError(
      "Report can only be edited while in submitted status",
    );
  }
  if (report.isLocked) {
    throw new DomainRuleError("Report is locked and cannot be edited");
  }
}

export function requireCanWithdrawReport(
  report: { citizenId: string | null; status: string; isLocked: boolean; isHidden: boolean },
  actor: Actor,
): void {
  if (!isOwner(report, actor)) throwVisibilityMask(report);
  if (report.status !== "submitted") {
    throw new DomainRuleError(
      "Report can only be withdrawn while in submitted status",
    );
  }
  if (report.isLocked) {
    throw new DomainRuleError("Report is locked and cannot be withdrawn");
  }
}

export function requireCanVoteOnReport(
  report: { citizenId: string | null; isHidden: boolean; isLocked: boolean },
  actor: Actor,
): void {
  if (isOwner(report, actor)) {
    throw new DomainRuleError("Cannot vote on your own report");
  }
  if (report.isHidden) {
    throw new NotFoundError("Report not found");
  }
  if (report.isLocked) {
    throw new DomainRuleError("Cannot vote on a locked report");
  }
}

export function requireCanSubscribeToReport(
  report: { citizenId: string | null; isHidden: boolean; isLocked: boolean },
  actor: Actor,
): void {
  if (report.isHidden && !isOwner(report, actor)) {
    throw new NotFoundError("Report not found");
  }
  if (report.isLocked) {
    throw new DomainRuleError("Cannot subscribe to a locked report");
  }
}

export function requireCanCommentOnReport(
  report: { isLocked: boolean },
): void {
  if (report.isLocked) {
    throw new DomainRuleError("Cannot comment on a locked report");
  }
}

export function requireCanEditComment(
  report: { isLocked: boolean; isHidden: boolean; citizenId: string | null },
  comment: { authorId: string | null; type: string; isHidden: boolean; createdAt: Date },
  actor: Actor,
  now: number = Date.now(),
): void {
  if (actor.role === "citizen" && report.isHidden && !isOwner(report, actor)) {
    throwVisibilityMask(report);
  }
  if (comment.authorId !== actor.id) {
    throw new ForbiddenError("Not allowed to edit comments you do not own");
  }
  if (comment.type === "status_note") {
    throw new DomainRuleError("Cannot edit status notes");
  }
  if (comment.isHidden) {
    throw new DomainRuleError("Cannot edit a hidden comment");
  }
  if (report.isLocked) {
    throw new DomainRuleError("Cannot edit comments on a locked report");
  }
  if (now - comment.createdAt.getTime() > 15 * 60 * 1000) {
    throw new DomainRuleError("Edit window has expired");
  }
}

export function requireReportVisibleToCitizen(
  report: { isHidden: boolean; citizenId: string | null },
  actor: { id: string; role: UserRole } | null,
): void {
  if (!report.isHidden) return;
  if (actor?.role === "citizen" && report.citizenId === actor.id) return;
  if (!actor || actor.role === "citizen") {
    throw new NotFoundError("Report not found");
  }
}
