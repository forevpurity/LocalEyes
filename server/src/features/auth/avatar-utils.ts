import { storage } from "../../services/storage.js";

/**
 * Delete a previously stored avatar object given its public URL.
 * Delegates to the active storage driver, which ignores URLs it doesn't own
 * and silently tolerates already-missing objects.
 */
export async function deleteAvatarFile(avatarUrl: string | null | undefined): Promise<void> {
  if (!avatarUrl) return;
  await storage.delete(avatarUrl);
}
