import { Router } from "express";
import { z } from "zod";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { reportPhotos } from "../../db/schema/report-photos.js";
import {
  NotFoundError,
  ValidationError,
  errorResponseSchema,
} from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { enforceStaffScope } from "./lib/enforce-staff-scope.js";
import {
  imageUpload,
  validateImageFiles,
  saveImageFiles,
  MAX_FILES,
  MAX_AFTER_PHOTOS,
} from "./lib/photo-upload.js";

const addPhotosResponseSchema = z
  .object({
    photos: z.array(
      z.object({
        id: z.uuid(),
        url: z.string(),
        order: z.number(),
        kind: z.enum(["before", "after"]),
      }),
    ),
  })
  .meta({ id: "AddPhotosResponse" });

export const addReportPhotosDoc = {
  summary: "Add after-resolution photos to a report",
  tags: ["Reports"],
  operationId: "addReportPhotos",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Report Id" }) }),
  },
  requestBody: {
    required: true,
    content: {
      "multipart/form-data": {
        schema: z.object({
          photos: z.array(z.file()),
        }),
      },
    },
  },
  responses: {
    201: {
      description: "Photos added",
      content: {
        "application/json": { schema: addPhotosResponseSchema },
      },
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

export function addReportPhotos(router: Router) {
  router.post(
    "/:id/photos",
    authenticate("staff", "admin"),
    imageUpload.array("photos", MAX_FILES),
    async (req, res) => {
      const actor = req.actor!;
      const { id } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new ValidationError("At least one photo is required", [
          { field: "photos", message: "At least one photo is required" },
        ]);
      }

      validateImageFiles(files);

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

      // Enforce the after-photo cap
      // NOTE: SELECT COUNT → check → INSERT is non-atomic. Two concurrent
      // requests could both pass the check and exceed MAX_AFTER_PHOTOS.
      // Acceptable for current traffic; a SERIALIZABLE isolation or
      // INSERT … ON CONFLICT DO NOTHING would harden it.
      const existingCountResult = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(reportPhotos)
        .where(and(eq(reportPhotos.reportId, id), eq(reportPhotos.kind, "after")));

      const existingCount = existingCountResult[0]?.count ?? 0;
      const remaining = MAX_AFTER_PHOTOS - existingCount;
      if (files.length > remaining) {
        throw new ValidationError(
          `You can add ${Math.max(0, remaining)} more resolution photo(s) (max ${MAX_AFTER_PHOTOS}).`,
          [{ field: "photos", message: `At most ${Math.max(0, remaining)} more photo(s) allowed` }],
        );
      }

      // Compute startOrder so after-photos sort after existing before-photos
      const maxOrderResult = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(${reportPhotos.order}), -1)` })
        .from(reportPhotos)
        .where(eq(reportPhotos.reportId, id));

      const startOrder = (maxOrderResult[0]?.maxOrder ?? -1) + 1;

      const savedFiles = await saveImageFiles(files, startOrder);

      const inserted = await db.insert(reportPhotos).values(
        savedFiles.map((f) => ({
          reportId: id,
          url: f.url,
          kind: "after" as const,
          order: f.order,
        })),
      ).returning({ id: reportPhotos.id });

      // Postgres guarantees RETURNING row order matches VALUES row order
      // for a single multi-row INSERT, so the indices align.
      const photos = savedFiles.map((f, i) => ({
        id: inserted[i]!.id,
        url: f.url,
        order: f.order,
        kind: "after" as const,
      }));

      res.status(201).json({ photos });
    },
  );
}
