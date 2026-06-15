import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { authenticate } from "../../common/auth.js";
import { errorResponseSchema } from "../../common/errors.js";
import { queryExportRows } from "./query-export-rows.js";

export const exportReportsGeojsonDoc = {
  summary: "Export all reports as GeoJSON",
  tags: ["Exports"],
  operationId: "exportReportsGeojson",
  responses: {
    200: {
      description: "GeoJSON FeatureCollection of reports",
      content: { "application/geo+json": { schema: z.object({}).loose() } },
    },
    401: {
      description: "Authentication required",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "Admin only",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function exportReportsGeojson(router: Router) {
  router.get("/reports.geojson", authenticate("admin"), async (_req, res) => {
    const rows = await queryExportRows();

    const featureCollection = {
      type: "FeatureCollection",
      features: rows.map((r) => ({
        type: "Feature",
        // GeoJSON coordinate order is [longitude, latitude].
        geometry: { type: "Point", coordinates: [r.longitude, r.latitude] },
        properties: {
          id: r.id,
          title: r.title,
          description: r.description,
          category: r.category,
          status: r.status,
          department: r.department,
          created_at: r.createdAt,
          resolved_at: r.resolvedAt,
        },
      })),
    };

    res.setHeader("Content-Type", "application/geo+json");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="reports.geojson"',
    );
    res.send(JSON.stringify(featureCollection));
  });
}
