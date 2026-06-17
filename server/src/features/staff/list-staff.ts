import { Router } from "express";
import { z } from "zod";
import { desc, eq, and, sql, isNull, isNotNull, ilike } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { users } from "../../db/schema/users.js";
import { departments } from "../../db/schema/departments.js";
import { errorResponseSchema } from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { parseAndValidate } from "../../common/validate.js";
import { encodeCursor, decodeCursor } from "../../common/pagination.js";
import { staffListItem } from "./schemas.js";

const listStaffQuerySchema = z.object({
  departmentId: z.uuid().optional(),
  status: z.enum(["active", "banned"]).optional(),
  name: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const listStaffResponse = z
  .object({
    items: z.array(staffListItem),
    nextCursor: z.string().nullable(),
  })
  .meta({ id: "ListStaffResponse" });

export const listStaffDoc = {
  summary: "List staff accounts",
  tags: ["Staff"],
  operationId: "listStaff",
  requestParams: {
    query: listStaffQuerySchema,
  },
  responses: {
    200: {
      description: "List of staff accounts",
      content: {
        "application/json": { schema: listStaffResponse },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function listStaff(router: Router) {
  router.get("/", authenticate("admin"), async (req, res) => {
    const query = parseAndValidate(listStaffQuerySchema, req.query);

    const conditions = [eq(users.role, "staff")];

    if (query.departmentId) {
      conditions.push(eq(users.departmentId, query.departmentId));
    }

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
        departmentId: users.departmentId,
        avatarUrl: users.avatarUrl,
        bannedAt: users.bannedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.createdAt), desc(users.id))
      .limit(query.limit + 1);

    const hasExtraRow = rows.length > query.limit;
    if (hasExtraRow) rows.pop();

    const deptIds = [
      ...new Set(rows.map((r) => r.departmentId).filter(Boolean) as string[]),
    ];

    const deptMap = new Map<string, string>();
    if (deptIds.length > 0) {
      const deptRows = await db
        .select({ id: departments.id, name: departments.name })
        .from(departments)
        .where(
          sql`${departments.id} IN (${sql.join(deptIds.map((id) => sql`${id}`), sql`, `)})`,
        );
      for (const d of deptRows) {
        deptMap.set(d.id, d.name);
      }
    }

    const items = rows.map((r) => ({
      id: r.id,
      email: r.email,
      displayName: r.displayName,
      departmentId: r.departmentId,
      departmentName: r.departmentId ? (deptMap.get(r.departmentId) ?? null) : null,
      avatarUrl: r.avatarUrl ?? null,
      bannedAt: r.bannedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));

    const nextCursor = hasExtraRow
      ? encodeCursor(rows[rows.length - 1].createdAt, rows[rows.length - 1].id)
      : null;

    res.json({ items, nextCursor });
  });
}
