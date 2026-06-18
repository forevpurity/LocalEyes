import { Router } from "express";
import { z } from "zod";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { errorResponseSchema } from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { banUser, banResponseSchema } from "../../services/ban-users.js";

export const banDoc = {
  summary: "Ban a staff member",
  tags: ["Staff"],
  operationId: "banStaff",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Staff Id" }) }),
  },
  responses: {
    200: {
      description: "Staff banned",
      content: {
        "application/json": { schema: banResponseSchema },
      },
    },
    403: {
      description: "Cannot ban yourself or an admin",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    404: {
      description: "Staff not found",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    422: {
      description: "Target is not a staff member",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function ban(router: Router) {
  router.post("/:id/ban", authenticate("admin"), async (req, res) => {
    const actor = req.actor!;
    const { id } = req.params;

    const result = await banUser(actor.id, id, "staff", true);
    res.json(result);
  });
}
