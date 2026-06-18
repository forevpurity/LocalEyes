import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/client.js";
import { notifications } from "../../db/schema/notifications.js";
import { authenticate } from "../../common/auth.js";
import { errorResponseSchema } from "../../common/errors.js";

const markAllReadResponse = z
  .object({
    count: z.number(),
  })
  .meta({ id: "MarkAllNotificationsReadResponse" });

export const markAllReadDoc = {
  summary: "Mark all notifications as read",
  tags: ["Notifications"],
  operationId: "markAllNotificationsRead",
  responses: {
    200: {
      description: "Unread notifications marked as read",
      content: {
        "application/json": { schema: markAllReadResponse },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    403: {
      description: "Only Citizens and Staff can mark notifications read",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function markAllRead(router: Router) {
  router.patch("/read", authenticate("citizen", "staff"), async (req, res) => {
    const actor = req.actor!;

    const rows = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(eq(notifications.recipientId, actor.id), isNull(notifications.readAt)),
      )
      .returning({ id: notifications.id });

    res.json({ count: rows.length });
  });
}
