import { Router } from "express";
import { z } from "zod";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { pool } from "../../db/client.js";

const healthResponse = z
  .object({ status: z.string(), db: z.string() })
  .meta({ id: "HealthResponse" });

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
    503: {
      description: "Service Unavailable — database is not reachable",
      content: {
        "application/json": { schema: healthResponse },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function checkHealth(router: Router) {
  router.get("/health", async (_req, res) => {
    let dbOk = false;
    try {
      await Promise.race([
        pool.query("SELECT 1"),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 2000),
        ),
      ]);
      dbOk = true;
    } catch {
      // dbOk stays false
    }

    if (!dbOk) {
      return res
        .status(503)
        .json({ status: "degraded", db: "disconnected" });
    }
    res.json({ status: "ok", db: "connected" });
  });
}
