import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { errorResponseSchema } from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { getReportForActor } from "./lib/report-projection.js";
import { reportCoreResponse } from "./lib/schemas.js";
import { loadReportForModeration } from "./lib/report-moderation.js";
import { emitNotifications } from "../notifications/notify.js";
import { createReportEventNotifications } from "./lib/report-notifications.js";

export const lockReportDoc = {
  summary: "Lock a report",
  tags: ["Reports"],
  operationId: "lockReport",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Report Id" }) }),
  },
  responses: {
    200: {
      description: "Report locked",
      content: {
        "application/json": { schema: reportCoreResponse },
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

      const report = await loadReportForModeration(id, actor);

      // Idempotent: locking an already-locked report is a no-op that emits no
      // duplicate notification.
      const notificationRows =
        report.isLocked
          ? []
          : await db.transaction(async (tx) => {
              await tx
                .update(reports)
                .set({ isLocked: true })
                .where(eq(reports.id, id));

              return createReportEventNotifications(tx, {
                kind: "locked",
                reportId: id,
                reportTitle: report.title,
                actorId: actor.id,
              });
            });

      emitNotifications(notificationRows);

      res.json(await getReportForActor(id, actor));
    },
  );
}
