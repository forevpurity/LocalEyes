import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { users, USER_ROLES } from "../../db/schema/users.js";
import { authenticate } from "../../common/auth.js";
import { parseAndValidate } from "../../common/validate.js";
import { UnauthorizedError, errorResponseSchema } from "../../common/errors.js";

const updateMeSchema = z
  .object({
    displayName: z.string().min(2).max(50),
  })
  .meta({ id: "UpdateMeRequest" });

const meResponse = z
  .object({
    id: z.uuid(),
    email: z.string(),
    displayName: z.string(),
    role: z.enum(USER_ROLES),
    departmentId: z.uuid().nullable(),
    mustChangePassword: z.boolean(),
  })
  .meta({ id: "MeResponse" });

export const meDoc = {
  summary: "Get current authenticated user",
  tags: ["Auth"],
  operationId: "getMe",
  responses: {
    200: {
      description: "Current user",
      content: {
        "application/json": { schema: meResponse },
      },
    },
    401: {
      description: "Not authenticated",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export const updateMeDoc = {
  summary: "Update current authenticated user",
  tags: ["Auth"],
  operationId: "updateMe",
  requestBody: {
    content: {
      "application/json": { schema: updateMeSchema },
    },
  },
  responses: {
    200: {
      description: "Updated current user",
      content: {
        "application/json": { schema: meResponse },
      },
    },
    400: {
      description: "Validation failed",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    401: {
      description: "Not authenticated",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function me(router: Router) {
  router.get("/me", authenticate(), async (req, res) => {
    const actor = req.actor!;

    const user = await db.query.users.findFirst({
      where: eq(users.id, actor.id),
      columns: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        departmentId: true,
        mustChangePassword: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }

    res.status(200).json(user);
  });

  router.patch("/me", authenticate(), async (req, res) => {
    const actor = req.actor!;
    const data = parseAndValidate(updateMeSchema, req.body);

    const [user] = await db
      .update(users)
      .set({ displayName: data.displayName })
      .where(eq(users.id, actor.id))
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        departmentId: users.departmentId,
        mustChangePassword: users.mustChangePassword,
      });

    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }

    res.status(200).json(user);
  });
}
