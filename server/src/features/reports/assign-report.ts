import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { departments } from "../../db/schema/departments.js";
import {
  NotFoundError,
  DomainRuleError,
  errorResponseSchema,
} from "../../common/errors.js";
import { parseAndValidate } from "../../common/validate.js";
import { authenticate } from "../../common/auth.js";
import { hydrateReport } from "./hydrate-report.js";
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

      res.json(await hydrateReport(id));
    },
  );
}
