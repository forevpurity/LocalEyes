import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { users, USER_ROLES } from "../../db/schema/users.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/token-utils.js";
import { UnauthorizedError } from "../../common/errors.js";
import { errorResponseSchema } from "../../common/errors.js";
import { zEmail } from "../../common/schemas.js";

const refreshResponse = z
  .object({
    id: z.uuid(),
    email: zEmail(),
    displayName: z.string(),
    role: z.enum(USER_ROLES),
    mustChangePassword: z.boolean(),
  })
  .meta({ id: "RefreshResponse" });

export const refreshDoc = {
  summary: "Refresh access token",
  tags: ["Auth"],
  operationId: "refresh",
  responses: {
    200: {
      description: "Token refreshed",
      content: {
        "application/json": { schema: refreshResponse },
      },
    },
    401: {
      description: "Invalid or expired refresh token",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function refresh(router: Router) {
  router.post("/refresh", async (req, res) => {
    const token = req.cookies?.refresh_token;
    if (!token) {
      throw new UnauthorizedError();
    }

    const payload = verifyRefreshToken(token);

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });
    if (!user) {
      throw new UnauthorizedError();
    }

    if (user.bannedAt) {
      res.clearCookie("access_token", { path: "/" });
      res.clearCookie("refresh_token", { path: "/api/auth" });
      throw new UnauthorizedError();
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Number(process.env.ACCESS_TOKEN_MAX_AGE_MS ?? 15 * 60 * 1000),
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: Number(process.env.REFRESH_TOKEN_MAX_AGE_MS ?? 7 * 24 * 60 * 60 * 1000),
    });

    res.status(200).json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });
  });
}
