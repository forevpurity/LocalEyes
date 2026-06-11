import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { users } from "../../db/schema/users.js";
import {
  NotFoundError,
  ForbiddenError,
} from "../../common/errors.js";
import type { UserRole } from "../../db/schema/users.js";

type Actor = { id: string; role: UserRole; displayName: string };

export async function enforceStaffScope(
  actor: Actor,
  report: { departmentId: string | null; isHidden: boolean },
): Promise<void> {
  if (actor.role !== "staff") return;

  const staffUser = await db.query.users.findFirst({
    where: eq(users.id, actor.id),
    columns: { departmentId: true },
  });

  if (staffUser?.departmentId !== report.departmentId) {
    throw report.isHidden
      ? new NotFoundError("Report not found")
      : new ForbiddenError(
          "Not allowed to act on reports outside your department",
        );
  }
}
