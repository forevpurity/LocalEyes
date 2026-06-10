import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { categories } from "../../db/schema/categories.js";
import { departments } from "../../db/schema/departments.js";
import { reportPhotos } from "../../db/schema/report-photos.js";
import { votes } from "../../db/schema/votes.js";
import {
  NotFoundError,
  DomainRuleError,
  errorResponseSchema,
} from "../../common/errors.js";
import { parseAndValidate } from "../../common/validate.js";
import { authenticate } from "../../common/auth.js";
import { reportResponse } from "./schemas.js";

const assignReportSchema = z
  .object({
    departmentId: z.uuid("Invalid department ID"),
  })
  .meta({ id: "AssignReportRequest" });

export const assignReportDoc = {
  summary: "Assign a report to a department",
  tags: ["Reports"],
  operationId: "assignReport",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Report Id" }) }),
  },
  requestBody: {
    required: true,
    content: {
      "application/json": { schema: assignReportSchema },
    },
  },
  responses: {
    200: {
      description: "Report assigned to department",
      content: {
        "application/json": { schema: reportResponse },
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
        "Business rule violated (report already assigned, department not found or inactive)",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function assignReport(router: Router) {
  router.patch(
    "/:id/assign",
    authenticate("admin"),
    async (req, res) => {
      const { id } = req.params;
      const data = parseAndValidate(assignReportSchema, req.body);

      const row = await db
        .select({
          id: reports.id,
          status: reports.status,
          departmentId: reports.departmentId,
          citizenId: reports.citizenId,
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

      if (report.departmentId !== null) {
        throw new DomainRuleError(
          "Report is already assigned to a department",
        );
      }

      const targetDept = await db.query.departments.findFirst({
        where: eq(departments.id, data.departmentId),
        columns: { id: true, isActive: true },
      });

      if (!targetDept) {
        throw new DomainRuleError("Department not found");
      }

      if (!targetDept.isActive) {
        throw new DomainRuleError(
          "Cannot assign to an inactive department",
        );
      }

      await db
        .update(reports)
        .set({ departmentId: data.departmentId })
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
