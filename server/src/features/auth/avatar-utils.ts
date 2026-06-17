import { resolve } from "path";
import { unlink } from "fs/promises";

/**
 * Delete an avatar file from disk if it lives under /uploads/.
 * Resolves the path and guards against traversal before unlinking.
 * Silently ignores missing files.
 */
export async function deleteAvatarFile(avatarUrl: string | null | undefined): Promise<void> {
  if (!avatarUrl || !avatarUrl.startsWith("/uploads/")) return;

  const uploadDir = resolve(process.env.UPLOAD_DIR ?? "uploads");
  const filename = avatarUrl.replace("/uploads/", "");
  const filePath = resolve(uploadDir, filename);

  // Path-traversal guard: the resolved path must be inside UPLOAD_DIR
  if (!filePath.startsWith(uploadDir + "/")) return;

  await unlink(filePath).catch(() => {
    // File may have already been deleted — ignore
  });
}
