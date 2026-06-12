import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { notifications } from "../../db/schema/notifications.js";
import { authenticate } from "../../common/auth.js";
import { errorResponseSchema, NotFoundError } from "../../common/errors.js";
import { notificationResponse } from "./schemas.js";

export const markReadDoc = {
  summary: "Mark notification as read",
  tags: ["Notifications"],
  operationId: "markNotificationRead",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Notification Id" }) }),
  },
  responses: {
    200: {
      description: "Notification marked as read",
      content: {
        "application/json": { schema: notificationResponse },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    403: {
      description: "Only Citizens can mark notifications read",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    404: {
      description: "Notification not found",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function markRead(router: Router) {
  router.patch("/:id/read", authenticate("citizen"), async (req, res) => {
    const actor = req.actor!;
    const { id } = req.params;

    const [row] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.recipientId, actor.id)))
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

    if (!row) {
      throw new NotFoundError("Notification not found");
    }

    res.json({
      ...row,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    });
  });
}
