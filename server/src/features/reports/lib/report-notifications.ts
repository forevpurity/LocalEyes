import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/index.js";
import { getReportSubscriberIds } from "./report-moderation.js";
import {
  createNotificationRows,
  type NotificationPayload,
} from "../../notifications/notify.js";

type DbTx = Pick<NodePgDatabase<typeof schema>, "insert" | "select">;

type ReportEvent =
  | { kind: "hidden";        reportId: string; reportTitle: string; ownerId: string | null }
  | { kind: "locked";        reportId: string; reportTitle: string; actorId: string }
  | { kind: "statusChanged"; reportId: string; reportTitle: string; newStatus: string; actorId: string }
  | { kind: "commented";     reportId: string; reportTitle: string; authorName: string; actorId: string };

export async function createReportEventNotifications(
  tx: DbTx,
  event: ReportEvent,
): Promise<NotificationPayload[]> {
  switch (event.kind) {
    case "hidden":
      if (!event.ownerId) return [];
      return createNotificationRows(tx, {
        recipientIds: [event.ownerId],
        reportId: event.reportId,
        template: { type: "report_hidden", reportTitle: event.reportTitle },
      });
    case "locked":
      return createNotificationRows(tx, {
        recipientIds: await getReportSubscriberIds(tx, event.reportId),
        actorId: event.actorId,
        reportId: event.reportId,
        template: { type: "report_locked", reportTitle: event.reportTitle },
      });
    case "statusChanged":
      return createNotificationRows(tx, {
        recipientIds: await getReportSubscriberIds(tx, event.reportId),
        actorId: event.actorId,
        reportId: event.reportId,
        template: { type: "status_change", reportTitle: event.reportTitle, newStatus: event.newStatus },
      });
    case "commented":
      return createNotificationRows(tx, {
        recipientIds: await getReportSubscriberIds(tx, event.reportId),
        actorId: event.actorId,
        reportId: event.reportId,
        template: { type: "new_comment", reportTitle: event.reportTitle, authorName: event.authorName },
      });
    default:
      event satisfies never;
      return [];
  }
}
