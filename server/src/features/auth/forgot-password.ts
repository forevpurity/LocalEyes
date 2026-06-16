import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { users } from "../../db/schema/users.js";
import { passwordResetTokens } from "../../db/schema/password-reset-tokens.js";
import { errorResponseSchema } from "../../common/errors.js";
import { parseAndValidate } from "../../common/validate.js";
import { zEmail } from "../../common/schemas.js";
import { sendEmail } from "../../common/email.js";
import { passwordResetLimiter } from "../../common/rate-limit.js";

const forgotPasswordSchema = z
  .object({
    email: zEmail(),
  })
  .meta({ id: "ForgotPasswordRequest" });

const forgotPasswordResponse = z
  .object({
    message: z.string(),
  })
  .meta({ id: "ForgotPasswordResponse" });

export const forgotPasswordDoc = {
  summary: "Request a password reset link",
  tags: ["Auth"],
  operationId: "forgotPassword",
  requestBody: {
    content: {
      "application/json": { schema: forgotPasswordSchema },
    },
  },
  responses: {
    200: {
      description: "Reset link sent (or silently ignored if email not found)",
      content: {
        "application/json": { schema: forgotPasswordResponse },
      },
    },
    429: {
      description: "Rate limited",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

function resetEmailHtml(resetLink: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #1a1a1a;">Reset your LocalEyes password</h2>
  <p style="color: #555;">We received a request to reset your LocalEyes password.</p>
  <p style="margin: 28px 0;">
    <a href="${resetLink}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
      Reset Password
    </a>
  </p>
  <p style="color: #888; font-size: 0.875rem;">This link expires in 1 hour.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #aaa; font-size: 0.8rem;">If you didn't request this, you can safely ignore this email.</p>
</body>
</html>`;
}

export function forgotPassword(router: Router) {
  router.post("/forgot-password", passwordResetLimiter, async (req, res) => {
    const { email } = parseAndValidate(forgotPasswordSchema, req.body);

    const user = await db.query.users.findFirst({
      columns: { id: true, email: true, bannedAt: true },
      where: eq(users.email, email),
    });

    // Banned users cannot reset — silently ignore (no user enumeration)
    if (user && !user.bannedAt) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      // Invalidate any outstanding tokens for this user
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, user.id));

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      const appUrl =
        process.env.APP_URL ?? "http://localhost:5173";
      const resetLink = `${appUrl}/reset-password?token=${rawToken}`;

      // Log the reset link in dev so it's clickable without reading the DB
      if (!process.env.SMTP_HOST || process.env.SMTP_HOST === "localhost") {
        console.log(`📧 Reset link: ${resetLink}`);
      }

      sendEmail({
        to: email,
        subject: "Reset your LocalEyes password",
        html: resetEmailHtml(resetLink),
      });
    }

    res.status(200).json({
      message:
        "If an account with that email exists, a reset link has been sent.",
    });
  });
}
