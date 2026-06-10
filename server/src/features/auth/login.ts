import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { users, USER_ROLES } from "../../db/schema/users.js";
import { signAccessToken, signRefreshToken } from "../../common/token-utils.js";
import { UnauthorizedError, ForbiddenError } from "../../common/errors.js";
import { errorResponseSchema } from "../../common/errors.js";
import { parseAndValidate } from "../../common/validate.js";
import { zEmail } from "../../common/schemas.js";

const loginSchema = z.object({
  email: zEmail(),
  password: z.string(),
}).meta({ id: "LoginRequest" });

const loginResponse = z
  .object({
    id: z.uuid(),
    email: zEmail(),
    displayName: z.string(),
    role: z.enum(USER_ROLES),
    mustChangePassword: z.boolean(),
  })
  .meta({ id: "LoginResponse" });

export const loginDoc = {
  summary: "Log in as a citizen",
  tags: ["Auth"],
  operationId: "login",
  requestBody: {
    content: {
      "application/json": { schema: loginSchema },
    },
  },
  responses: {
    200: {
      description: "Logged in",
      content: {
        "application/json": { schema: loginResponse },
      },
    },
    401: {
      description: "Invalid credentials",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    403: {
      description: "Account is banned",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function login(router: Router) {
  router.post("/login", async (req, res) => {
    const { email, password } = parseAndValidate(loginSchema, req.body);

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.bannedAt) {
      throw new ForbiddenError("Account is banned");
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
