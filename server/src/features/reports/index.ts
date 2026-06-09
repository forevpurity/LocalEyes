import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { createReport, createReportDoc } from "./create-report.js";

export const reportsRouter = Router();

createReport(reportsRouter);

export const reportsPaths = {
  "/reports": {
    post: createReportDoc,
  },
} satisfies ZodOpenApiPathsObject;