import type { Comment, Report, ReportDetail, User } from "@/types/api";
import { isWithinPast } from "@/lib/utils";

/**
 * Whether the current user may moderate a report (change status, hide/unhide
 * comments). Admins can moderate any report; staff are limited to reports in
 * their own department. Mirrors the server's `enforceStaffScope` rule so the
 * UI only shows controls the API will actually accept.
 */
export function canModerate(
  report: Pick<Report, "departmentId">,
  user: User | null,
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (
    user.role === "staff" &&
    user.departmentId != null &&
    user.departmentId === report.departmentId
  );
}

/** 15-minute window for editing a comment. */
export const EDIT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Whether the current user may upvote a report.
 * Citizen, not the report owner.
 */
export function canVote(
  report: Pick<ReportDetail, "isOwner">,
  user: User | null,
): boolean {
  return user?.role === "citizen" && !report.isOwner;
}

/**
 * Whether the current user may edit the report.
 * Owner, submitted status, not locked.
 */
export function canEditReport(
  report: Pick<ReportDetail, "isOwner" | "status" | "isLocked">,
): boolean {
  return report.isOwner && report.status === "submitted" && !report.isLocked;
}

/**
 * Whether the current user may edit a comment.
 * Author, discussion type, not hidden, report not locked, within 15-minute window.
 */
export function canEditComment(
  comment: Pick<Comment, "isMine" | "isHidden" | "type" | "createdAt">,
  report: Pick<ReportDetail, "isLocked">,
): boolean {
  return (
    comment.isMine &&
    !comment.isHidden &&
    comment.type === "discussion" &&
    !report.isLocked &&
    isWithinPast(comment.createdAt, EDIT_WINDOW_MS)
  );
}
