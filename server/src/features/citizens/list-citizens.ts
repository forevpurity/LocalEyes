import { Router } from "express";
import { z } from "zod";
import { desc, eq, and, sql, isNull, isNotNull, ilike } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { users } from "../../db/schema/users.js";
import { errorResponseSchema } from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { parseAndValidate } from "../../common/validate.js";
import { citizenListItem } from "./schemas.js";

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({ c: createdAt.toISOString(), i: id }),
  ).toString("base64url");
}

function decodeCursor(cursor: string): { c: Date; i: string } {
  const raw = JSON.parse(Buffer.from(cursor, "base64url").toString("utf-8"));
  return { c: new Date(raw.c), i: raw.i };
}

const listCitizensQuerySchema = z.object({
  status: z.enum(["active", "banned"]).optional(),
  name: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const listCitizensResponse = z
  .object({
    items: z.array(citizenListItem),
    nextCursor: z.string().nullable(),
  })
  .meta({ id: "ListCitizensResponse" });

export const listCitizensDoc = {
  summary: "List citizen accounts",
  tags: ["Citizens"],
  operationId: "listCitizens",
  requestParams: {
    query: listCitizensQuerySchema,
  },
  responses: {
    200: {
      description: "List of citizen accounts",
      content: {
        "application/json": { schema: listCitizensResponse },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function listCitizens(router: Router) {
  router.get("/", authenticate("admin"), async (req, res) => {
    const query = parseAndValidate(listCitizensQuerySchema, req.query);

    const conditions = [eq(users.role, "citizen")];

    if (query.status === "active") {
      conditions.push(isNull(users.bannedAt));
    } else if (query.status === "banned") {
      conditions.push(isNotNull(users.bannedAt));
    }

    if (query.name) {
      const escaped = query.name.replace(/[%_]/g, "\\$&");
      conditions.push(ilike(users.displayName, `%${escaped}%`));
    }

    if (query.cursor) {
      const { c, i } = decodeCursor(query.cursor);
      conditions.push(
        sql`(${users.createdAt} < ${c} OR (${users.createdAt} = ${c} AND ${users.id} < ${i}))`,
      );
    }

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        bannedAt: users.bannedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.createdAt), desc(users.id))
      .limit(query.limit + 1);

    const hasExtraRow = rows.length > query.limit;
    if (hasExtraRow) rows.pop();

    const items = rows.map((r) => ({
      id: r.id,
      email: r.email,
      displayName: r.displayName,
      bannedAt: r.bannedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));

    const nextCursor = hasExtraRow
      ? encodeCursor(rows[rows.length - 1].createdAt, rows[rows.length - 1].id)
      : null;

    res.json({ items, nextCursor });
  });
}
