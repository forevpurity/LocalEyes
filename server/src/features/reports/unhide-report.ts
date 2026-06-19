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

export const unhideReportDoc = {
  summary: "Unhide a report",
  tags: ["Reports"],
  operationId: "unhideReport",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Report Id" }) }),
  },
  responses: {
    200: {
      description: "Report unhidden",
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

export function unhideReport(router: Router) {
  router.patch(
    "/:id/unhide",
    authenticate("staff", "admin"),
    async (req, res) => {
      const actor = req.actor!;
      const { id } = req.params;

      const report = await loadReportForModeration(id, actor);

      // Restoring public visibility is not notification-worthy, and the owner
      // never lost access to their hidden report anyway (see CONTEXT.md
      // "Notification"). Idempotent if already visible.
      if (report.isHidden) {
        await db
          .update(reports)
          .set({ isHidden: false })
          .where(eq(reports.id, id));
      }

      res.json(await getReportForActor(id, actor));
    },
  );
}
