import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { comments } from "../../db/schema/comments.js";
import {
  NotFoundError,
  errorResponseSchema,
} from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { requireCanWithdrawReport } from "./report-rules.js";
import { getReportForActor } from "./report-projection.js";
import { reportCoreResponse } from "./schemas.js";
import { emitNotifications } from "../notifications/notify.js";
import { createReportEventNotifications } from "./report-notifications.js";

export const withdrawReportDoc = {
  summary: "Withdraw a report",
  tags: ["Reports"],
  operationId: "withdrawReport",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Report Id" }) }),
  },
  responses: {
    200: {
      description: "Report withdrawn",
      content: {
        "application/json": { schema: reportCoreResponse },
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

export function withdrawReport(router: Router) {
  router.patch(
    "/:id/withdraw",
    authenticate("citizen"),
    async (req, res) => {
      const actor = req.actor!;
      const { id } = req.params;

      const row = await db
        .select({
          id: reports.id,
          title: reports.title,
          status: reports.status,
          isHidden: reports.isHidden,
          isLocked: reports.isLocked,
          citizenId: reports.citizenId,
          categoryId: reports.categoryId,
          address: reports.address,
          departmentId: reports.departmentId,
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

      requireCanWithdrawReport(report, actor);

      const notificationRows = await db.transaction(async (tx) => {
        await tx
          .update(reports)
          .set({ status: "withdrawn" })
          .where(eq(reports.id, id));

        await tx.insert(comments).values({
          reportId: id,
          authorId: actor.id,
          body: "Report withdrawn by citizen",
          type: "status_note",
          newStatus: "withdrawn",
        });

        return createReportEventNotifications(tx, {
          kind: "statusChanged",
          reportId: id,
          reportTitle: report.title,
          newStatus: "withdrawn",
          actorId: actor.id,
        });
      });

      emitNotifications(notificationRows);

      res.json(await getReportForActor(id, actor));
    },
  );
}
