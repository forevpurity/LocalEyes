import { Router } from "express";
import { z } from "zod";
import { desc, eq, and, sql, isNull, isNotNull, ilike } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { users } from "../../db/schema/users.js";
import { departments } from "../../db/schema/departments.js";
import {
  NotFoundError,
  errorResponseSchema,
} from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { parseAndValidate } from "../../common/validate.js";
import { encodeCursor, decodeCursor } from "../../common/pagination.js";
import { staffListItem } from "../staff/schemas.js";

const listDepartmentStaffQuerySchema = z.object({
  status: z.enum(["active", "banned"]).optional(),
  name: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const listDepartmentStaffResponse = z
  .object({
    items: z.array(staffListItem),
    nextCursor: z.string().nullable(),
  })
  .meta({ id: "ListDepartmentStaffResponse" });

export const listDepartmentStaffDoc = {
  summary: "List staff for a department",
  tags: ["Departments"],
  operationId: "listDepartmentStaff",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Department Id" }) }),
    query: listDepartmentStaffQuerySchema,
  },
  responses: {
    200: {
      description: "List of staff in the department",
      content: {
        "application/json": { schema: listDepartmentStaffResponse },
      },
    },
    404: {
      description: "Department not found",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function listDepartmentStaff(router: Router) {
  router.get("/:id/staff", authenticate("admin"), async (req, res) => {
    const { id } = req.params;
    const query = parseAndValidate(listDepartmentStaffQuerySchema, req.query);

    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, id),
      columns: { id: true, name: true },
    });
    if (!dept) {
      throw new NotFoundError("Department not found");
    }

    const conditions = [eq(users.role, "staff"), eq(users.departmentId, id)];

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
      departmentId: r.departmentId,
      departmentName: dept.name,
      bannedAt: r.bannedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));

    const nextCursor = hasExtraRow
      ? encodeCursor(rows[rows.length - 1].createdAt, rows[rows.length - 1].id)
      : null;

    res.json({ items, nextCursor });
  });
}
