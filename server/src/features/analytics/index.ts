import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { getSummary, getSummaryDoc } from "./get-summary.js";
import {
  getDepartmentSummary,
  getDepartmentSummaryDoc,
} from "./get-department-summary.js";

export const analyticsRouter = Router();

getSummary(analyticsRouter);
getDepartmentSummary(analyticsRouter);

export const analyticsPaths = {
  "/admin/analytics/summary": {
    get: getSummaryDoc,
  },
  "/admin/analytics/department": {
    get: getDepartmentSummaryDoc,
  },
} satisfies ZodOpenApiPathsObject;
