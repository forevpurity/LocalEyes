import { z } from "zod";
import { NOTIFICATION_TYPES } from "../../db/schema/notifications.js";

export const notificationResponse = z
  .object({
    id: z.uuid(),
    recipientId: z.uuid(),
    reportId: z.uuid(),
    type: z.enum(NOTIFICATION_TYPES),
    title: z.string(),
    body: z.string().nullable(),
    readAt: z.string().nullable(),
    createdAt: z.string(),
  })
  .meta({ id: "NotificationResponse" });

export const listNotificationsResponse = z
  .object({
    items: z.array(notificationResponse),
    nextCursor: z.string().nullable(),
  })
  .meta({ id: "ListNotificationsResponse" });
