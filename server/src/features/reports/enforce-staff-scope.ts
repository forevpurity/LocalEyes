import { eq, isNull, type SQL } from "drizzle-orm";
import { db } from "../../db/client.js";
import { users } from "../../db/schema/users.js";
import { reports } from "../../db/schema/reports.js";
import {
  NotFoundError,
  ForbiddenError,
} from "../../common/errors.js";
import type { UserRole } from "../../db/schema/users.js";

type Actor = { id: string; role: UserRole; displayName: string };

async function resolveStaffDepartmentId(
  actor: Actor,
): Promise<string | null> {
  if (actor.role !== "staff") return null;

  const staffUser = await db.query.users.findFirst({
    where: eq(users.id, actor.id),
    columns: { departmentId: true },
  });

  return staffUser?.departmentId ?? null;
}

export async function enforceStaffScope(
  actor: Actor,
  report: { departmentId: string | null; isHidden: boolean },
): Promise<void> {
  if (actor.role !== "staff") return;

  const staffDepartmentId = await resolveStaffDepartmentId(actor);

  if (staffDepartmentId !== report.departmentId) {
    throw report.isHidden
      ? new NotFoundError("Report not found")
      : new ForbiddenError(
          "Not allowed to act on reports outside your department",
        );
  }
}

export async function staffDepartmentFilter(
  actor: Actor,
): Promise<SQL | undefined> {
  if (actor.role !== "staff") return undefined;

  const staffDepartmentId = await resolveStaffDepartmentId(actor);

  return staffDepartmentId !== null
    ? eq(reports.departmentId, staffDepartmentId)
    : isNull(reports.departmentId);
}
