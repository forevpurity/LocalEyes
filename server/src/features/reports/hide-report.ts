import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { errorResponseSchema } from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { hydrateReport } from "./hydrate-report.js";
import { reportResponse } from "./schemas.js";
import { loadReportForModeration } from "./report-moderation.js";
import {
  createNotificationRows,
  emitNotifications,
} from "../notifications/notify.js";

export const hideReportDoc = {
  summary: "Hide a report",
  tags: ["Reports"],
  operationId: "hideReport",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Report Id" }) }),
  },
  responses: {
    200: {
      description: "Report hidden",
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

      const report = await loadReportForModeration(id, actor);

      // Idempotent: hiding an already-hidden report is a no-op.
      if (report.isHidden) {
        res.json(await hydrateReport(id));
        return;
      }

      // `report_hidden` is owner-targeted only — the report leaves public view,
      // so notifying other subscribers would point them at content they can no
      // longer see (see CONTEXT.md "Notification"). An anonymised report has no
      // owner to notify, but is still hidden.
      const notificationRows = await db.transaction(async (tx) => {
        await tx
          .update(reports)
          .set({ isHidden: true })
          .where(eq(reports.id, id));

        if (!report.citizenId) return [];

        return createNotificationRows(tx, {
          recipientIds: [report.citizenId],
          reportId: id,
          template: {
            type: "report_hidden",
            reportTitle: report.title,
          },
        });
      });

      emitNotifications(notificationRows);

      res.json(await hydrateReport(id));
    },
  );
}
