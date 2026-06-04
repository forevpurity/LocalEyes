import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { checkHealth, checkHealthDoc } from "./check-health.js";

export const healthRouter = Router();

// ── Use-case registration (one line per use-case) ──
checkHealth(healthRouter);

export const healthPaths = {
  "/health": { get: checkHealthDoc },
} satisfies ZodOpenApiPathsObject;
