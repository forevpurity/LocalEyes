import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { categories } from "../../db/schema/categories.js";
import { reportPhotos } from "../../db/schema/report-photos.js";
import { votes } from "../../db/schema/votes.js";
import {
  NotFoundError,
  errorResponseSchema,
} from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { enforceStaffScope } from "./enforce-staff-scope.js";
import { reportResponse } from "./schemas.js";

export const hideReportDoc = {
  summary: "Toggle report visibility",
  tags: ["Reports"],
  operationId: "hideReport",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Report Id" }) }),
  },
  responses: {
    200: {
      description: "Report visibility toggled",
      content: {
        "application/json": { schema: reportResponse },
      },
    },
    403: {
      description: "Staff accessing a report outside their department",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    404: {
      description: "Report not found",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function hideReport(router: Router) {
  router.patch(
    "/:id/hide",
    authenticate("staff", "admin"),
    async (req, res) => {
      const actor = req.actor!;
      const { id } = req.params;

      const row = await db
        .select({
          isHidden: reports.isHidden,
          departmentId: reports.departmentId,
          categoryId: reports.categoryId,
          address: reports.address,
          latitude: sql<number>`ST_Y(${reports.location})`,
          longitude: sql<number>`ST_X(${reports.location})`,
          createdAt: reports.createdAt,
        })
        .from(reports)
        .where(eq(reports.id, id))
        .limit(1);

      if (row.length === 0) {
        throw new NotFoundError("Report not found");
      }

      const report = row[0];

      await enforceStaffScope(actor, report);

      await db
        .update(reports)
        .set({ isHidden: !report.isHidden })
        .where(eq(reports.id, id));

      const [updated] = await db
        .select({
          id: reports.id,
          title: reports.title,
          description: reports.description,
          status: reports.status,
          address: reports.address,
          departmentId: reports.departmentId,
          createdAt: reports.createdAt,
        })
        .from(reports)
        .where(eq(reports.id, id))
        .limit(1);

      const [catRow, photoRows, voteRow] = await Promise.all([
        db
          .select({ name: categories.name })
          .from(categories)
          .where(eq(categories.id, report.categoryId))
          .limit(1),
        db
          .select({ url: reportPhotos.url, order: reportPhotos.order })
          .from(reportPhotos)
          .where(eq(reportPhotos.reportId, id))
          .orderBy(reportPhotos.order),
        db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(votes)
          .where(eq(votes.reportId, id)),
      ]);

      res.json({
        id: updated.id,
        title: updated.title,
        description: updated.description,
        categoryId: report.categoryId,
        categoryName: catRow[0]?.name ?? "",
        status: updated.status,
        address: updated.address,
        latitude: report.latitude,
        longitude: report.longitude,
        departmentId: updated.departmentId,
        photos: photoRows,
        voteCount: voteRow[0]?.count ?? 0,
        createdAt: updated.createdAt.toISOString(),
      });
    },
  );
}
