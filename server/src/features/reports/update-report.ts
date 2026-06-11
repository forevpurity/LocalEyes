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
import { parseAndValidate } from "../../common/validate.js";
import { authenticate } from "../../common/auth.js";
import { requireCanEditReport } from "./report-rules.js";
import { reportResponse } from "./schemas.js";

const updateReportSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be at most 200 characters")
      .optional(),
    description: z
      .string()
      .min(1, "Description is required")
      .max(2000, "Description must be at most 2000 characters")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  })
  .meta({ id: "UpdateReportRequest" });

export const updateReportDoc = {
  summary: "Update a report",
  tags: ["Reports"],
  operationId: "updateReport",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Report Id" }) }),
  },
  requestBody: {
    content: {
      "application/json": { schema: updateReportSchema },
    },
  },
  responses: {
    200: {
      description: "Report updated",
      content: {
        "application/json": { schema: reportResponse },
      },
    },
    400: {
      description: "Validation failed or empty body",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    403: {
      description: "Not the report owner",
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
    422: {
      description:
        "Business rule violated (not in submitted status, or report is locked)",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function updateReport(router: Router) {
  router.patch(
    "/:id",
    authenticate("citizen"),
    async (req, res) => {
      const actor = req.actor!;
      const { id } = req.params;
      const data = parseAndValidate(updateReportSchema, req.body);

      const row = await db
        .select({
          id: reports.id,
          title: reports.title,
          description: reports.description,
          status: reports.status,
          address: reports.address,
          departmentId: reports.departmentId,
          isHidden: reports.isHidden,
          isLocked: reports.isLocked,
          citizenId: reports.citizenId,
          categoryId: reports.categoryId,
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

      requireCanEditReport(report, actor);

      const updateValues: Record<string, unknown> = {};
      if (data.title !== undefined) updateValues.title = data.title;
      if (data.description !== undefined)
        updateValues.description = data.description;

      const [updated] = await db
        .update(reports)
        .set(updateValues)
        .where(eq(reports.id, id))
        .returning({
          id: reports.id,
          title: reports.title,
          description: reports.description,
          status: reports.status,
          address: reports.address,
          departmentId: reports.departmentId,
          createdAt: reports.createdAt,
        });

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
