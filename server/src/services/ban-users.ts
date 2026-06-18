import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { users } from "../db/schema/users.js";
import {
  NotFoundError,
  ForbiddenError,
  DomainRuleError,
} from "../common/errors.js";

export type BanTargetRole = "citizen" | "staff";

/**
 * Shared response schema used by all ban/unban endpoints.
 * The client also mirrors this as `BanResponse` in `client/src/types/api.ts`.
 */
export const banResponseSchema = z
  .object({
    banned: z.boolean(),
  })
  .meta({ id: "BanResponse" });

/**
 * Throw ForbiddenError if the user identified by the JWT payload is currently
 * banned.  Used in both HTTP middleware (authenticate) and the Socket.io
 * handshake so a ban cuts off all access paths at once.
 */
export async function ensureNotBanned(payload: { sub: string }) {
  const user = await db.query.users.findFirst({
    columns: { bannedAt: true },
    where: eq(users.id, payload.sub),
  });

  if (user?.bannedAt) {
    throw new ForbiddenError("Account is banned");
  }
}

/**
 * Ban or unban a single user, enforcing role scoping and safety guards.
 *
 * Rules:
 * - The actor cannot ban themselves
 * - Cannot ban an admin
 * - Target must have the expected `role`
 * - Target must exist
 *
 * Idempotent: re-banning an already-banned user preserves the original
 * `bannedAt` timestamp.  Unbanning an already-active user is a no-op.
 */
export async function banUser(
  actorId: string,
  id: string,
  role: BanTargetRole,
  banned: boolean,
): Promise<{ banned: boolean }> {
  if (id === actorId) {
    throw new ForbiddenError("Cannot ban yourself");
  }

  const rows = await db
    .select({ id: users.id, role: users.role, bannedAt: users.bannedAt })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (rows.length === 0) {
    throw new NotFoundError(`${role} not found`);
  }

  const user = rows[0];

  if (user.role === "admin") {
    throw new ForbiddenError("Cannot ban an admin");
  }
  if (user.role !== role) {
    throw new DomainRuleError(`Can only ${banned ? "ban" : "unban"} ${role}s`);
  }

  if (banned) {
    // Only set bannedAt if not already banned — preserve original ban timestamp
    if (!user.bannedAt) {
      await db
        .update(users)
        .set({ bannedAt: new Date() })
        .where(eq(users.id, id));
    }
  } else {
    // Only clear bannedAt if currently banned
    if (user.bannedAt) {
      await db
        .update(users)
        .set({ bannedAt: null })
        .where(eq(users.id, id));
    }
  }

  return { banned };
}
