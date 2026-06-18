import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { notifications } from "../../db/schema/notifications.js";
import { authenticate } from "../../common/auth.js";
import { errorResponseSchema } from "../../common/errors.js";

const unreadCountResponse = z
  .object({
    count: z.number(),
  })
  .meta({ id: "UnreadNotificationCountResponse" });

export const getUnreadCountDoc = {
  summary: "Get unread notification count",
  tags: ["Notifications"],
  operationId: "getUnreadNotificationCount",
  responses: {
    200: {
      description: "Unread notification count",
      content: {
        "application/json": { schema: unreadCountResponse },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    403: {
      description: "Only Citizens and Staff can get unread notification count",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function getUnreadCount(router: Router) {
  router.get("/unread-count", authenticate("citizen", "staff"), async (req, res) => {
    const actor = req.actor!;

    const [row] = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(notifications)
      .where(
        and(eq(notifications.recipientId, actor.id), isNull(notifications.readAt)),
      );

    res.json({ count: row.count });
  });
}
