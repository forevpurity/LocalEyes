import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { getSummary, getSummaryDoc } from "./get-summary.js";

export const analyticsRouter = Router();

getSummary(analyticsRouter);

export const analyticsPaths = {
  "/admin/analytics/summary": {
    get: getSummaryDoc,
  },
} satisfies ZodOpenApiPathsObject;
