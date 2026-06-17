import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import multer from "multer";
import { randomUUID } from "crypto";
import { resolve } from "path";
import { writeFile } from "fs/promises";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { users } from "../../db/schema/users.js";
import { authenticate } from "../../common/auth.js";
import {
  ValidationError,
  errorResponseSchema,
} from "../../common/errors.js";
import { setAuthCookies } from "./auth-cookies.js";
import { deleteAvatarFile } from "./avatar-utils.js";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const ALLOWED_MIMES = new Set(Object.keys(MIME_TO_EXT));
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

const avatarUploadResponse = z
  .object({
    avatarUrl: z.string().nullable(),
  })
  .meta({ id: "AvatarUploadResponse" });

export const uploadAvatarDoc = {
  summary: "Upload a profile avatar",
  tags: ["Auth"],
  operationId: "uploadAvatar",
  requestBody: {
    required: true,
    content: {
      "multipart/form-data": {
        schema: z.object({
          avatar: z.file(),
        }),
      },
    },
  },
  responses: {
    200: {
      description: "Avatar uploaded",
      content: {
        "application/json": { schema: avatarUploadResponse },
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

export function uploadAvatar(router: Router) {
  router.post(
    "/avatar",
    authenticate(),
    upload.single("avatar"),
    async (req, res) => {
      const actor = req.actor!;
      const file = req.file;

      if (!file) {
        throw new ValidationError("Avatar file is required", [
          { field: "avatar", message: "Please select an image file" },
        ]);
      }

      if (!ALLOWED_MIMES.has(file.mimetype)) {
        throw new ValidationError("Invalid file type", [
          {
            field: "avatar",
            message: "File must be JPEG, PNG, or WebP",
          },
        ]);
      }

      const ext = MIME_TO_EXT[file.mimetype];
      const filename = `${randomUUID()}.${ext}`;
      const url = `/uploads/${filename}`;
      const uploadDir = resolve(UPLOAD_DIR);
      await writeFile(`${uploadDir}/${filename}`, file.buffer);

      // Fetch existing avatar before updating so we can clean up the old file
      const existing = await db.query.users.findFirst({
        where: eq(users.id, actor.id),
        columns: { avatarUrl: true },
      });

      await deleteAvatarFile(existing?.avatarUrl);

      await db
        .update(users)
        .set({ avatarUrl: url })
        .where(eq(users.id, actor.id));

      // Re-issue cookies so the JWT carries the new avatarUrl immediately
      setAuthCookies(res, {
        id: actor.id,
        role: actor.role,
        displayName: actor.displayName,
        avatarUrl: url,
      });

      res.json({ avatarUrl: url });
    },
  );
}
