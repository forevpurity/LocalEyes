import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { users, USER_ROLES } from "../../db/schema/users.js";
import { signAccessToken, signRefreshToken } from "../../common/token-utils.js";
import { ConflictError } from "../../common/errors.js";
import { errorResponseSchema } from "../../common/errors.js";
import { parseAndValidate } from "../../common/validate.js";
import { zEmail } from "../../common/schemas.js";

const registerSchema = z.object({
  email: zEmail(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(50),
}).meta({ id: "RegisterRequest" });

export const registerResponse = z
  .object({
    id: z.uuid(),
    email: zEmail(),
    displayName: z.string(),
    role: z.enum(USER_ROLES),
  })
  .meta({ id: "RegisterResponse" });

export const registerDoc = {
  summary: "Register a new citizen account",
  tags: ["Auth"],
  operationId: "register",
  requestBody: {
    content: {
      "application/json": { schema: registerSchema },
    },
  },
  responses: {
    201: {
      description: "Account created",
      content: {
        "application/json": { schema: registerResponse },
      },
    },
    400: {
      description: "Validation failed",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    409: {
      description: "Email already registered",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function register(router: Router) {
  router.post("/register", async (req, res) => {
    const { email, password, displayName } = parseAndValidate(registerSchema, req.body);

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, displayName, role: "citizen" })
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
      });

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

    res.status(201).json(user);
  });
}
