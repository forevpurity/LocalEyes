import { Router } from "express";
import { z } from "zod";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { reportPhotos } from "../../db/schema/report-photos.js";
import { subscriptions } from "../../db/schema/subscriptions.js";
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
import {
  imageUpload,
  validateImageFiles,
  saveImageFiles,
  MAX_FILES,
} from "./photo-upload.js";

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
    imageUpload.array("photos", MAX_FILES),
    async (req, res) => {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new ValidationError("At least one photo is required", [
          { field: "photos", message: "At least one photo is required" },
        ]);
      }

      validateImageFiles(files);

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

      const savedFiles = await saveImageFiles(files);

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
            kind: "before" as const,
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
        photos: savedFiles.map((f) => ({ url: f.url, order: f.order, kind: "before" })),
        voteCount: 0,
        createdAt: result.createdAt.toISOString(),
      };

      // Broadcast to all map viewers for real-time updates
      emitToMapViewers("report:created", reportPayload);

      res.status(201).json(reportPayload);
    },
  );
}
