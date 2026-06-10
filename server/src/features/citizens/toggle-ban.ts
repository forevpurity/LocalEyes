import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { users } from "../../db/schema/users.js";
import {
  NotFoundError,
  ForbiddenError,
  DomainRuleError,
  errorResponseSchema,
} from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";

const toggleBanResponse = z
  .object({
    banned: z.boolean(),
  })
  .meta({ id: "ToggleBanResponse" });

export const toggleBanDoc = {
  summary: "Toggle ban on a citizen",
  tags: ["Citizens"],
  operationId: "toggleBan",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Citizen Id" }) }),
  },
  responses: {
    200: {
      description: "Ban toggled",
      content: {
        "application/json": { schema: toggleBanResponse },
      },
    },
    403: {
      description: "Cannot ban yourself or another admin",
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

export function toggleBan(router: Router) {
  router.patch("/:id/ban", authenticate("admin"), async (req, res) => {
    const actor = req.actor!;
    const { id } = req.params;

    if (id === actor.id) {
      throw new ForbiddenError("Cannot ban yourself");
    }

    const rows = await db
      .select({
        id: users.id,
        role: users.role,
        bannedAt: users.bannedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundError("Citizen not found");
    }

    const user = rows[0];

    if (user.role === "admin") {
      throw new ForbiddenError("Cannot ban an admin");
    }

    if (user.role !== "citizen") {
      throw new DomainRuleError("Can only ban citizens");
    }

    if (user.bannedAt) {
      await db
        .update(users)
        .set({ bannedAt: null })
        .where(eq(users.id, id));
      res.json({ banned: false });
    } else {
      await db
        .update(users)
        .set({ bannedAt: new Date() })
        .where(eq(users.id, id));
      res.json({ banned: true });
    }
  });
}
