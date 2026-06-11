import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { desc, eq, and, sql, isNull, inArray } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports, REPORT_STATUSES } from "../../db/schema/reports.js";
import { categories } from "../../db/schema/categories.js";
import { departments } from "../../db/schema/departments.js";
import { users } from "../../db/schema/users.js";
import { reportPhotos } from "../../db/schema/report-photos.js";
import { parseAndValidate } from "../../common/validate.js";
import { encodeCursor, decodeCursor } from "../../common/pagination.js";
import { queryBoolean } from "../../common/schemas.js";
import {
  ValidationError,
  UnauthorizedError,
  errorResponseSchema,
} from "../../common/errors.js";
import { optionalAuthenticate } from "../../common/auth.js";

const MAP_LIMIT = 200;

const listReportsQuerySchema = z.object({
  minLat: z.coerce.number().min(-90).max(90).optional(),
  maxLat: z.coerce.number().min(-90).max(90).optional(),
  minLng: z.coerce.number().min(-180).max(180).optional(),
  maxLng: z.coerce.number().min(-180).max(180).optional(),
  categoryId: z.uuid().optional(),
  q: z.string().optional(),
  status: z.enum(REPORT_STATUSES).optional(),
  mine: queryBoolean.optional(),
  departmentId: z.uuid().optional(),
  unassigned: queryBoolean.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const reportListItemSchema = z
  .object({
    id: z.uuid(),
    title: z.string(),
    description: z.string(),
    categoryId: z.uuid(),
    categoryName: z.string(),
    status: z.string(),
    address: z.string().nullable(),
    latitude: z.number(),
    longitude: z.number(),
    departmentId: z.uuid().nullable(),
    departmentName: z.string().nullable(),
    citizenName: z.string().nullable(),
    photos: z.array(z.object({ url: z.string(), order: z.number() })),
    voteCount: z.number(),
    hasVoted: z.boolean(),
    isHidden: z.boolean(),
    isLocked: z.boolean(),
    createdAt: z.string(),
  })
  .meta({ id: "ReportListItem" });

const listReportsResponseSchema = z
  .object({
    items: z.array(reportListItemSchema),
    nextCursor: z.string().nullable().optional(),
    hasMore: z.boolean().optional(),
  })
  .meta({ id: "ListReportsResponse" });

export const listReportsDoc = {
  summary: "List reports",
  tags: ["Reports"],
  operationId: "listReports",
  requestParams: {
    query: listReportsQuerySchema,
  },
  responses: {
    200: {
      description: "List of reports",
      content: {
        "application/json": { schema: listReportsResponseSchema },
      },
    },
    400: {
      description: "Validation failed",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    401: {
      description: "Authentication required (for mine=true or expired token)",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function listReports(router: Router) {
  router.get("/", optionalAuthenticate(), async (req, res) => {
    const actor = req.actor ?? null;
    const query = parseAndValidate(listReportsQuerySchema, req.query);

    const isStaff = actor?.role === "staff";
    const isAdmin = actor?.role === "admin";
    const isGuestOrCitizen = !actor || actor.role === "citizen";
    const hasBbox =
      query.minLat != null &&
      query.maxLat != null &&
      query.minLng != null &&
      query.maxLng != null;

    if (query.mine && !actor) {
      throw new UnauthorizedError("Authentication required for mine=true");
    }

    if (isGuestOrCitizen && !hasBbox && !query.mine) {
      throw new ValidationError("Must supply bounding box or mine=true", [
        {
          field: "bbox",
          message: "Supply minLat, maxLat, minLng, maxLng or set mine=true",
        },
      ]);
    }

    let staffDepartmentId: string | null = null;
    if (isStaff) {
      const staffUser = await db.query.users.findFirst({
        where: eq(users.id, actor!.id),
        columns: { departmentId: true },
      });
      staffDepartmentId = staffUser?.departmentId ?? null;
    }

    const conditions = [];

    if (!query.mine && isGuestOrCitizen) {
      conditions.push(eq(reports.isHidden, false));

      if (hasBbox && !query.status) {
        conditions.push(
          sql`${reports.status} NOT IN ('closed', 'rejected', 'withdrawn')`,
        );
      }
    }

    if (hasBbox) {
      conditions.push(
        sql`ST_Within(${reports.location}, ST_MakeEnvelope(${query.minLng}, ${query.minLat}, ${query.maxLng}, ${query.maxLat}, 4326))`,
      );
    }

    if (query.categoryId) {
      conditions.push(eq(reports.categoryId, query.categoryId));
    }

    if (query.q) {
      const escaped = query.q.replace(/[%_]/g, "\\$&");
      conditions.push(sql`${reports.title} ILIKE ${`%${escaped}%`}`);
    }

    if (query.status) {
      conditions.push(eq(reports.status, query.status));
    }

    if (query.mine && actor?.role === "citizen") {
      conditions.push(eq(reports.citizenId, actor.id));
    }

    if (isStaff && staffDepartmentId) {
      conditions.push(eq(reports.departmentId, staffDepartmentId));
    }

    if (isAdmin && query.departmentId) {
      conditions.push(eq(reports.departmentId, query.departmentId));
    }

    if (isAdmin && query.unassigned) {
      conditions.push(isNull(reports.departmentId));
    }

    if (query.cursor) {
      const { c, i } = decodeCursor(query.cursor);
      conditions.push(
        sql`(${reports.createdAt} < ${c} OR (${reports.createdAt} = ${c} AND ${reports.id} < ${i}))`,
      );
    }

    const isMapQuery = hasBbox && isGuestOrCitizen;
    const fetchLimit = isMapQuery ? MAP_LIMIT : query.limit;

    const rows = await db
      .select({
        id: reports.id,
        title: reports.title,
        description: reports.description,
        status: reports.status,
        address: reports.address,
        departmentId: reports.departmentId,
        isHidden: reports.isHidden,
        isLocked: reports.isLocked,
        createdAt: reports.createdAt,
        categoryId: reports.categoryId,
        latitude: sql<number>`ST_Y(${reports.location})`,
        longitude: sql<number>`ST_X(${reports.location})`,
        categoryName: categories.name,
        departmentName: departments.name,
        citizenName: users.displayName,
        voteCount: sql<number>`(SELECT COUNT(*)::int FROM votes WHERE votes.report_id = ${reports.id})`,
        hasVoted:
          actor?.role === "citizen"
            ? sql<boolean>`EXISTS(SELECT 1 FROM votes WHERE votes.report_id = ${reports.id} AND votes.citizen_id = ${actor.id})`
            : sql<boolean>`false`,
      })
      .from(reports)
      .innerJoin(categories, eq(reports.categoryId, categories.id))
      .leftJoin(departments, eq(reports.departmentId, departments.id))
      .leftJoin(users, eq(reports.citizenId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reports.createdAt), desc(reports.id))
      .limit(fetchLimit + 1);

    const hasExtraRow = rows.length > fetchLimit;
    if (hasExtraRow) rows.pop();

    const reportIds = rows.map((r) => r.id);
    const photoRows =
      reportIds.length > 0
        ? await db
            .select({
              reportId: reportPhotos.reportId,
              url: reportPhotos.url,
              order: reportPhotos.order,
            })
            .from(reportPhotos)
            .where(inArray(reportPhotos.reportId, reportIds))
            .orderBy(reportPhotos.order)
        : [];

    const photoMap = new Map<string, { url: string; order: number }[]>();
    for (const p of photoRows) {
      const list = photoMap.get(p.reportId) ?? [];
      list.push({ url: p.url, order: p.order });
      photoMap.set(p.reportId, list);
    }

    const items = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      status: r.status,
      address: r.address,
      latitude: r.latitude,
      longitude: r.longitude,
      departmentId: r.departmentId,
      departmentName: r.departmentName,
      citizenName: r.citizenName,
      photos: photoMap.get(r.id) ?? [],
      voteCount: r.voteCount,
      hasVoted: r.hasVoted,
      isHidden: r.isHidden,
      isLocked: r.isLocked,
      createdAt: r.createdAt.toISOString(),
    }));

    if (isMapQuery) {
      res.json({ items, hasMore: hasExtraRow });
    } else {
      const nextCursor = hasExtraRow
        ? encodeCursor(
            rows[rows.length - 1].createdAt,
            rows[rows.length - 1].id,
          )
        : null;
      res.json({ items, nextCursor });
    }
  });
}
