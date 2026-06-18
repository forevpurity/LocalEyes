import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { notifications } from "../../db/schema/notifications.js";
import { authenticate } from "../../common/auth.js";
import { errorResponseSchema } from "../../common/errors.js";
import { encodeCursor, decodeCursor } from "../../common/pagination.js";
import { queryBoolean } from "../../common/schemas.js";
import { parseAndValidate } from "../../common/validate.js";
import { listNotificationsResponse } from "./schemas.js";

const listNotificationsQuerySchema = z.object({
  unread: queryBoolean.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listNotificationsDoc = {
  summary: "List notifications",
  tags: ["Notifications"],
  operationId: "listNotifications",
  requestParams: {
    query: listNotificationsQuerySchema,
  },
  responses: {
    200: {
      description: "List of notifications",
      content: {
        "application/json": { schema: listNotificationsResponse },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    403: {
      description: "Only Citizens and Staff can list notifications",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function listNotifications(router: Router) {
  router.get("/", authenticate("citizen", "staff"), async (req, res) => {
    const actor = req.actor!;
    const query = parseAndValidate(listNotificationsQuerySchema, req.query);

    const conditions = [eq(notifications.recipientId, actor.id)];

    if (query.unread) {
      conditions.push(isNull(notifications.readAt));
    }

    if (query.cursor) {
      const { c, i } = decodeCursor(query.cursor);
      conditions.push(
        sql`(${notifications.createdAt} < ${c} OR (${notifications.createdAt} = ${c} AND ${notifications.id} < ${i}))`,
      );
    }

    const rows = await db
      .select({
        id: notifications.id,
        recipientId: notifications.recipientId,
        reportId: notifications.reportId,
        type: notifications.type,
        title: notifications.title,
        body: notifications.body,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt), desc(notifications.id))
      .limit(query.limit + 1);

    const hasExtraRow = rows.length > query.limit;
    if (hasExtraRow) rows.pop();

    const items = rows.map((row) => ({
      ...row,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }));

    const nextCursor = hasExtraRow
      ? encodeCursor(rows[rows.length - 1].createdAt, rows[rows.length - 1].id)
      : null;

    res.json({ items, nextCursor });
  });
}
