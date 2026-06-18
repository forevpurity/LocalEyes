import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { errorResponseSchema } from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { getReportForActor } from "./report-projection.js";
import { reportCoreResponse } from "./schemas.js";
import { loadReportForModeration } from "./report-moderation.js";

export const unlockReportDoc = {
  summary: "Unlock a report",
  tags: ["Reports"],
  operationId: "unlockReport",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Report Id" }) }),
  },
  responses: {
    200: {
      description: "Report unlocked",
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

export function unlockReport(router: Router) {
  router.patch(
    "/:id/unlock",
    authenticate("staff", "admin"),
    async (req, res) => {
      const actor = req.actor!;
      const { id } = req.params;

      const report = await loadReportForModeration(id, actor);

      // Lifting a restriction is not notification-worthy; unlock stays silent
      // (see CONTEXT.md "Notification"). Idempotent if already unlocked.
      if (report.isLocked) {
        await db
          .update(reports)
          .set({ isLocked: false })
          .where(eq(reports.id, id));
      }

      res.json(await getReportForActor(id, actor));
    },
  );
}
