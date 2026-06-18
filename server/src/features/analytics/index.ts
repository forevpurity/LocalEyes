import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { getSummary, getSummaryDoc } from "./get-summary.js";
import {
  getDepartmentSummary,
  getDepartmentSummaryDoc,
} from "./get-department-summary.js";
import { getDashboard, getDashboardDoc } from "./get-dashboard.js";

export const analyticsRouter = Router();

getSummary(analyticsRouter);
getDepartmentSummary(analyticsRouter);
getDashboard(analyticsRouter);

export const analyticsPaths = {
  "/admin/analytics/summary": {
    get: getSummaryDoc,
  },
  "/admin/analytics/department": {
    get: getDepartmentSummaryDoc,
  },
  "/admin/analytics/dashboard": {
    get: getDashboardDoc,
  },
} satisfies ZodOpenApiPathsObject;
