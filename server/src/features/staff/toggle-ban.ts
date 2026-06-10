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
  .meta({ id: "ToggleStaffBanResponse" });

export const toggleBanDoc = {
  summary: "Toggle ban on a staff member",
  tags: ["Staff"],
  operationId: "toggleStaffBan",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Staff Id" }) }),
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
      throw new NotFoundError("Staff not found");
    }

    const user = rows[0];

    if (user.role === "admin") {
      throw new ForbiddenError("Cannot ban an admin");
    }

    if (user.role !== "staff") {
      throw new DomainRuleError("Can only ban staff members");
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
