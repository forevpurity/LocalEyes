import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { randomUUID } from "crypto";
import { extname } from "path";
import { writeFile } from "fs/promises";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { reportPhotos } from "../../db/schema/report-photos.js";
import { subscriptions } from "../../db/schema/subscriptions.js";
import { categories } from "../../db/schema/categories.js";
import {
  ValidationError,
  DomainRuleError,
  errorResponseSchema,
} from "../../common/errors.js";
import { parseAndValidate } from "../../common/validate.js";
import { authenticate } from "../../common/auth.js";
import { reportCreateLimiter } from "../../common/rate-limit.js";
import { getCoveringDepartment } from "../../common/geo.js";
import { reportResponse } from "./schemas.js";
import { emitToMapViewers } from "../../common/socket.js";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const ALLOWED_MIMES = new Set(Object.keys(MIME_TO_EXT));
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
});

const createReportSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be at most 200 characters"),
    description: z
      .string()
      .min(1, "Description is required")
      .max(2000, "Description must be at most 2000 characters"),
    latitude: z.coerce
      .number()
      .min(-90)
      .max(90, "Latitude must be between -90 and 90"),
    longitude: z.coerce
      .number()
      .min(-180)
      .max(180, "Longitude must be between -180 and 180"),
    address: z.string().optional(),
    categoryId: z.uuid("Invalid category ID"),
  })
  .meta({ id: "CreateReportRequest" });

export const createReportDoc = {
  summary: "Create a new report",
  tags: ["Reports"],
  operationId: "createReport",
  requestBody: {
    required: true,
    content: {
      "multipart/form-data": {
        schema: z.object({
          title: z.string(),
          description: z.string(),
          latitude: z.string(),
          longitude: z.string(),
          address: z.string().optional(),
          categoryId: z.string(),
          photos: z.array(z.file()),
        }),
      },
    },
  },
  responses: {
    201: {
      description: "Report created",
      content: {
        "application/json": { schema: reportResponse },
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
    422: {
      description:
        "Business rule violated (e.g. category not valid for location)",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function createReport(router: Router) {
  router.post(
    "/",
    reportCreateLimiter,
    authenticate("citizen"),
    upload.array("photos", MAX_FILES),
    async (req, res) => {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new ValidationError("At least one photo is required", [
          { field: "photos", message: "At least one photo is required" },
        ]);
      }

      for (const file of files) {
        if (!ALLOWED_MIMES.has(file.mimetype)) {
          throw new ValidationError("Invalid file type", [
            {
              field: "photos",
              message: `File "${file.originalname}" is not a supported image type. Allowed: JPEG, PNG, WebP`,
            },
          ]);
        }
      }

      const data = parseAndValidate(createReportSchema, req.body);

      const covering = await getCoveringDepartment(
        data.latitude,
        data.longitude,
      );

      const validCategoryIds = new Set(covering.categories.map((c) => c.id));
      if (!validCategoryIds.has(data.categoryId)) {
        throw new DomainRuleError(
          covering.department
            ? `Category does not belong to department "${covering.department.name}"`
            : "Category not found",
        );
      }

      const savedFiles: { filename: string; url: string; order: number }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = MIME_TO_EXT[file.mimetype];
        const filename = `${randomUUID()}.${ext}`;
        const url = `/uploads/${filename}`;
        await writeFile(`${UPLOAD_DIR}/${filename}`, file.buffer);
        savedFiles.push({ filename, url, order: i });
      }

      const catName = covering.categories.find(
        (c) => c.id === data.categoryId,
      )!.name;

      const result = await db.transaction(async (tx) => {
        const [report] = await tx
          .insert(reports)
          .values({
            title: data.title,
            description: data.description,
            location: { lng: data.longitude, lat: data.latitude },
            address: data.address || null,
            categoryId: data.categoryId,
            departmentId: covering.department?.id ?? null,
            citizenId: req.actor!.id,
          })
          .returning({
            id: reports.id,
            title: reports.title,
            description: reports.description,
            status: reports.status,
            address: reports.address,
            departmentId: reports.departmentId,
            citizenId: reports.citizenId,
            createdAt: reports.createdAt,
          });

        await tx.insert(reportPhotos).values(
          savedFiles.map((f) => ({
            reportId: report.id,
            url: f.url,
            order: f.order,
          })),
        );

        await tx.insert(subscriptions).values({
          reportId: report.id,
          citizenId: req.actor!.id,
        });

        return report;
      });

      const reportPayload = {
        id: result.id,
        title: result.title,
        description: result.description,
        categoryId: data.categoryId,
        categoryName: catName,
        status: result.status,
        address: data.address || null,
        latitude: data.latitude,
        longitude: data.longitude,
        departmentId: covering.department?.id ?? null,
        photos: savedFiles.map((f) => ({ url: f.url, order: f.order })),
        voteCount: 0,
        createdAt: result.createdAt.toISOString(),
      };

      // Broadcast to all map viewers for real-time updates
      emitToMapViewers("report:created", reportPayload);

      res.status(201).json(reportPayload);
    },
  );
}
