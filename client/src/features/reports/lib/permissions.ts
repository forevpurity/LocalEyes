import type { Report, User } from "@/types/api";

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
