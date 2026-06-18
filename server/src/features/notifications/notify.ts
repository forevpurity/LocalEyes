import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { db } from "../../db/client.js";
import type * as schema from "../../db/schema/index.js";
import { notifications, type NotificationType } from "../../db/schema/notifications.js";
import { getIO } from "../../common/socket.js";

type DbExecutor = Pick<NodePgDatabase<typeof schema>, "insert">;

type NotificationTemplateInput =
  | {
      type: "status_change";
      reportTitle: string;
      newStatus: string;
    }
  | {
      type: "new_comment";
      reportTitle: string;
      authorName: string;
    }
  | {
      type: "report_locked";
      reportTitle: string;
    }
  | {
      type: "report_hidden";
      reportTitle: string;
    }
  | {
      type: "new_report";
      reportTitle: string;
      departmentName: string;
    };

export type NotificationPayload = {
  id: string;
  recipientId: string;
  reportId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  readAt: Date | null;
  createdAt: Date;
};

function renderNotification(input: NotificationTemplateInput): {
  title: string;
  body: string;
} {
  switch (input.type) {
    case "status_change":
      return {
        title: "Report status updated",
        body: `Report '${input.reportTitle}' status changed to ${input.newStatus}`,
      };
    case "new_comment":
      return {
        title: "New comment on report",
        body: `${input.authorName} commented on '${input.reportTitle}'`,
      };
    case "report_locked":
      return {
        title: "Report locked",
        body: `Report '${input.reportTitle}' has been locked`,
      };
    case "report_hidden":
      return {
        title: "Report hidden",
        body: `Your report '${input.reportTitle}' has been hidden`,
      };
    case "new_report":
      return {
        title: "New report in your department",
        body: `New report '${input.reportTitle}' filed in ${input.departmentName}`,
      };
  }
}

export async function createNotificationRows(
  executor: DbExecutor,
  params: {
    recipientIds: string[];
    actorId?: string;
    reportId: string;
    template: NotificationTemplateInput;
  },
): Promise<NotificationPayload[]> {
  const recipientIds = [...new Set(params.recipientIds)].filter(
    (id) => id !== params.actorId,
  );

  if (recipientIds.length === 0) return [];

  const rendered = renderNotification(params.template);

  return executor
    .insert(notifications)
    .values(
      recipientIds.map((recipientId) => ({
        recipientId,
        reportId: params.reportId,
        type: params.template.type,
        title: rendered.title,
        body: rendered.body,
      })),
    )
    .returning({
      id: notifications.id,
      recipientId: notifications.recipientId,
      reportId: notifications.reportId,
      type: notifications.type,
      title: notifications.title,
      body: notifications.body,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    });
}

export function emitNotifications(rows: NotificationPayload[]) {
  const io = getIO();
  if (!io) return;

  for (const row of rows) {
    try {
      io.to(`user:${row.recipientId}`).emit("notification", {
        ...row,
        readAt: row.readAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      });
    } catch {
      // Socket.io is best-effort; the persisted notification is authoritative.
    }
  }
}

export async function notify(params: {
  recipientIds: string[];
  actorId?: string;
  reportId: string;
  template: NotificationTemplateInput;
}) {
  const rows = await createNotificationRows(db, params);
  emitNotifications(rows);
  return rows;
}
