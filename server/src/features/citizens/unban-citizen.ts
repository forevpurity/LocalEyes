import { Router } from "express";
import { z } from "zod";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { errorResponseSchema } from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { banUser, banResponseSchema } from "../../common/ban-users.js";

export const unbanDoc = {
  summary: "Unban a citizen",
  tags: ["Citizens"],
  operationId: "unbanCitizen",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Citizen Id" }) }),
  },
  responses: {
    200: {
      description: "Citizen unbanned",
      content: {
        "application/json": { schema: banResponseSchema },
      },
    },
    403: {
      description: "Cannot unban yourself or an admin",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    404: {
      description: "Citizen not found",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    422: {
      description: "Target is not a citizen",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function unban(router: Router) {
  router.post("/:id/unban", authenticate("admin"), async (req, res) => {
    const actor = req.actor!;
    const { id } = req.params;

    const result = await banUser(actor.id, id, "citizen", false);
    res.json(result);
  });
}
