import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { eq, and, isNull, gt } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { users, USER_ROLES } from "../../db/schema/users.js";
import { passwordResetTokens } from "../../db/schema/password-reset-tokens.js";
import { DomainRuleError, ForbiddenError, errorResponseSchema } from "../../common/errors.js";
import { parseAndValidate } from "../../common/validate.js";
import { zEmail } from "../../common/schemas.js";
import { setAuthCookies } from "./auth-cookies.js";

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z.string().min(8),
  })
  .meta({ id: "ResetPasswordRequest" });

const resetPasswordResponse = z
  .object({
    id: z.uuid(),
    email: zEmail(),
    displayName: z.string(),
    role: z.enum(USER_ROLES),
    departmentId: z.uuid().nullable(),
    mustChangePassword: z.boolean(),
  })
  .meta({ id: "ResetPasswordResponse" });

export const resetPasswordDoc = {
  summary: "Reset password using a reset token",
  tags: ["Auth"],
  operationId: "resetPassword",
  requestBody: {
    content: {
      "application/json": { schema: resetPasswordSchema },
    },
  },
  responses: {
    200: {
      description: "Password reset — user is logged in",
      content: {
        "application/json": { schema: resetPasswordResponse },
      },
    },
    403: {
      description: "Account is banned",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    422: {
      description: "Invalid or expired reset token",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function resetPassword(router: Router) {
  router.post("/reset-password", async (req, res) => {
    const { token, newPassword } = parseAndValidate(
      resetPasswordSchema,
      req.body,
    );

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Look up the token to find which user it belongs to, without consuming it yet.
    // We need the user's bannedAt before we decide whether to proceed.
    const [tokenRow] = await db
      .select({ userId: passwordResetTokens.userId })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.consumedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!tokenRow) {
      throw new DomainRuleError(
        "Invalid or expired reset token. Please request a new one.",
      );
    }

    // Check ban status BEFORE consuming the token or changing the password.
    // A banned account is frozen — no mutations, no token burn.
    const user = await db.query.users.findFirst({
      columns: { id: true, bannedAt: true },
      where: eq(users.id, tokenRow.userId),
    });

    if (!user) {
      throw new DomainRuleError("User no longer exists.");
    }

    if (user.bannedAt) {
      throw new ForbiddenError("Account is banned");
    }

    // Multi-step writes run inside a transaction: consume-token → update-password → clean-up-tokens
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await db.transaction(async (tx) => {
      // 1. Atomically consume the token — mark consumed_at
      const [consumed] = await tx
        .update(passwordResetTokens)
        .set({ consumedAt: new Date() })
        .where(
          and(
            eq(passwordResetTokens.tokenHash, tokenHash),
            isNull(passwordResetTokens.consumedAt),
            gt(passwordResetTokens.expiresAt, new Date()),
          ),
        )
        .returning({ userId: passwordResetTokens.userId });

      // Guard against concurrent consumption between our SELECT and this UPDATE
      if (!consumed) {
        throw new DomainRuleError(
          "Invalid or expired reset token. Please request a new one.",
        );
      }

      // 2. Update the password
      await tx
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          mustChangePassword: false,
        })
        .where(eq(users.id, consumed.userId));

      // 3. Clean up any remaining tokens for this user
      await tx
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, consumed.userId));
    });

    // Re-fetch the full user record for the response + cookie payload
    const fullUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!fullUser) {
      throw new DomainRuleError("User no longer exists.");
    }

    setAuthCookies(res, fullUser);

    res.status(200).json({
      id: fullUser.id,
      email: fullUser.email,
      displayName: fullUser.displayName,
      role: fullUser.role,
      departmentId: fullUser.departmentId,
      mustChangePassword: fullUser.mustChangePassword,
    });
  });
}
