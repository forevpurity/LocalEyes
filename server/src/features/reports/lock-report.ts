import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import {
  NotFoundError,
  errorResponseSchema,
} from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { enforceStaffScope } from "./enforce-staff-scope.js";
import { hydrateReport } from "./hydrate-report.js";
import { reportResponse } from "./schemas.js";

export const lockReportDoc = {
  summary: "Toggle report lock",
  tags: ["Reports"],
  operationId: "lockReport",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Report Id" }) }),
  },
  responses: {
    200: {
      description: "Report lock toggled",
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

export function lockReport(router: Router) {
  router.patch(
    "/:id/lock",
    authenticate("staff", "admin"),
    async (req, res) => {
      const actor = req.actor!;
      const { id } = req.params;

      const row = await db
        .select({
          isHidden: reports.isHidden,
          isLocked: reports.isLocked,
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
        .set({ isLocked: !report.isLocked })
        .where(eq(reports.id, id));

      res.json(await hydrateReport(id));
    },
  );
}
