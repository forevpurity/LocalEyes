import { Router } from "express";
import { z } from "zod";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { eq, and } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { reportPhotos } from "../../db/schema/report-photos.js";
import {
  NotFoundError,
  ValidationError,
  errorResponseSchema,
} from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { enforceStaffScope } from "./enforce-staff-scope.js";
import { storage } from "../../common/storage.js";

export const removeReportPhotoDoc = {
  summary: "Remove a resolution photo from a report",
  tags: ["Reports"],
  operationId: "removeReportPhoto",
  requestParams: {
    path: z.object({
      id: z.uuid().meta({ description: "Report Id" }),
      photoId: z.uuid().meta({ description: "Photo Id" }),
    }),
  },
  responses: {
    204: {
      description: "Photo removed",
    },
    400: {
      description: "Validation failed",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    403: {
      description: "Forbidden — not a resolution photo or wrong department",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    404: {
      description: "Report or photo not found",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function removeReportPhoto(router: Router) {
  router.delete(
    "/:id/photos/:photoId",
    authenticate("staff", "admin"),
    async (req, res) => {
      const actor = req.actor!;
      const { id, photoId } = req.params;

      const report = await db.query.reports.findFirst({
        where: eq(reports.id, id),
        columns: {
          id: true,
          departmentId: true,
          isHidden: true,
        },
      });

      if (!report) {
        throw new NotFoundError("Report not found");
      }

      await enforceStaffScope(actor, report);

      const photo = await db.query.reportPhotos.findFirst({
        where: and(eq(reportPhotos.id, photoId), eq(reportPhotos.reportId, id)),
        columns: {
          id: true,
          url: true,
          kind: true,
        },
      });

      if (!photo) {
        throw new NotFoundError("Photo not found");
      }

      // Only allow removal of after-photos (protect citizen before-evidence)
      if (photo.kind !== "after") {
        throw new ValidationError("Only resolution photos can be removed");
      }

      // Delete the stored object (best-effort — a missing object ≠ 500)
      await storage.delete(photo.url);

      await db.delete(reportPhotos).where(eq(reportPhotos.id, photoId));

      res.status(204).end();
    },
  );
}
