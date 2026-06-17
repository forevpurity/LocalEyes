import type { UserRole } from "../db/schema/users.js";

declare global {
  namespace Express {
    interface Request {
      actor?: {
        id: string;
        role: UserRole;
        displayName: string;
        avatarUrl: string | null;
      };
    }
  }
}
