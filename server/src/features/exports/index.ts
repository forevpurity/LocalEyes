import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { exportReportsCsv, exportReportsCsvDoc } from "./export-reports-csv.js";
import {
  exportReportsGeojson,
  exportReportsGeojsonDoc,
} from "./export-reports-geojson.js";

export const exportsRouter = Router();

exportReportsCsv(exportsRouter);
exportReportsGeojson(exportsRouter);

export const exportsPaths = {
  "/admin/exports/reports.csv": {
    get: exportReportsCsvDoc,
  },
  "/admin/exports/reports.geojson": {
    get: exportReportsGeojsonDoc,
  },
} satisfies ZodOpenApiPathsObject;
