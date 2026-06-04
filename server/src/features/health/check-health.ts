import { Router } from "express";
import { z } from "zod";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { authenticate } from "../../common/auth.js";
import { errorResponseSchema } from "../../common/errors.js";

const healthResponse = z.object({ status: z.string() }).meta({ id: "HealthResponse" });

export const checkHealthDoc = {
  summary: "Health check",
  tags: ["Health"],
  operationId: "checkHealth",
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": { schema: healthResponse },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function checkHealth(router: Router) {
  router.get("/health", authenticate(), (req, res) => {
    res.json({ status: "ok" });
  });
}
