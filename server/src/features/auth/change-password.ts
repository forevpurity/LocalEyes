import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { users } from "../../db/schema/users.js";
import {
  UnauthorizedError,
  DomainRuleError,
  errorResponseSchema,
} from "../../common/errors.js";
import { parseAndValidate } from "../../common/validate.js";
import { authenticate } from "../../common/auth.js";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8),
  })
  .meta({ id: "ChangePasswordRequest" });

export const changePasswordDoc = {
  summary: "Change password",
  tags: ["Auth"],
  operationId: "changePassword",
  requestBody: {
    content: {
      "application/json": { schema: changePasswordSchema },
    },
  },
  responses: {
    200: {
      description: "Password changed",
    },
    401: {
      description: "Current password is incorrect",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    422: {
      description: "Current password required when not forced",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function changePassword(router: Router) {
  router.patch("/password", authenticate(), async (req, res) => {
    const actor = req.actor!;
    const { currentPassword, newPassword } = parseAndValidate(
      changePasswordSchema,
      req.body,
    );

    const [row] = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
        mustChangePassword: users.mustChangePassword,
      })
      .from(users)
      .where(eq(users.id, actor.id))
      .limit(1);

    if (!row) {
      throw new UnauthorizedError("User no longer exists");
    }

    if (!row.mustChangePassword) {
      if (!currentPassword) {
        throw new DomainRuleError(
          "Current password is required",
        );
      }
      const valid = await bcrypt.compare(currentPassword, row.passwordHash);
      if (!valid) {
        throw new UnauthorizedError("Current password is incorrect");
      }
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      })
      .where(eq(users.id, actor.id));

    res.status(200).json({ message: "Password changed" });
  });
}
