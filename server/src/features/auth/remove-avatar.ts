import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { users } from "../../db/schema/users.js";
import { authenticate } from "../../common/auth.js";
import { errorResponseSchema } from "../../common/errors.js";
import { setAuthCookies } from "./auth-cookies.js";
import { deleteAvatarFile } from "./avatar-utils.js";

const avatarRemoveResponse = z
  .object({
    avatarUrl: z.null(),
  })
  .meta({ id: "AvatarRemoveResponse" });

export const removeAvatarDoc = {
  summary: "Remove profile avatar",
  tags: ["Auth"],
  operationId: "removeAvatar",
  responses: {
    200: {
      description: "Avatar removed",
      content: {
        "application/json": { schema: avatarRemoveResponse },
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

export function removeAvatar(router: Router) {
  router.delete("/avatar", authenticate(), async (req, res) => {
    const actor = req.actor!;

    // Fetch existing avatar before updating so we can clean up the old file
    const existing = await db.query.users.findFirst({
      where: eq(users.id, actor.id),
      columns: { avatarUrl: true },
    });

    await deleteAvatarFile(existing?.avatarUrl);

    await db
      .update(users)
      .set({ avatarUrl: null })
      .where(eq(users.id, actor.id));

    // Re-issue cookies so the JWT drops avatarUrl immediately
    setAuthCookies(res, {
      id: actor.id,
      role: actor.role,
      displayName: actor.displayName,
      avatarUrl: null,
    });

    res.json({ avatarUrl: null });
  });
}
