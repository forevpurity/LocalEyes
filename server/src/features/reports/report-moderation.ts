import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../db/schema/index.js";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { subscriptions } from "../../db/schema/subscriptions.js";
import { users, type UserRole } from "../../db/schema/users.js";
import { NotFoundError } from "../../common/errors.js";
import { enforceStaffScope } from "./enforce-staff-scope.js";

type Actor = { id: string; role: UserRole; displayName: string };

export type ModerationReport = {
  title: string;
  isHidden: boolean;
  isLocked: boolean;
  citizenId: string | null;
  departmentId: string | null;
};

/**
 * Load a report for a moderation action (hide/unhide, lock/unlock) and enforce
 * the actor's department scope. Throws NotFoundError if the report is missing.
 */
export async function loadReportForModeration(
  id: string,
  actor: Actor,
): Promise<ModerationReport> {
  const report = await db.query.reports.findFirst({
    where: eq(reports.id, id),
    columns: {
      title: true,
      isHidden: true,
      isLocked: true,
      citizenId: true,
      departmentId: true,
    },
  });

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  await enforceStaffScope(actor, report);

  return report;
}

/**
 * The Citizen subscribers of a report — the audience for fan-out notifications.
 * Owner subscriptions are automatic, so this includes the owner; callers pass
 * `actorId` to `createNotificationRows` to avoid self-notifying.
 */
export async function getReportSubscriberIds(
  executor: Pick<NodePgDatabase<typeof schema>, "select">,
  reportId: string,
): Promise<string[]> {
  const recipients = await executor
    .select({ id: subscriptions.citizenId })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.citizenId, users.id))
    .where(
      and(eq(subscriptions.reportId, reportId), eq(users.role, "citizen")),
    );

  return recipients.map((recipient) => recipient.id);
}
