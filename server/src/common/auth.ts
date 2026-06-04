import type { RequestHandler } from "express";
import { verifyAccessToken } from "./token-utils.js";
import { UnauthorizedError, ForbiddenError } from "./errors.js";
import type { UserRole } from "../db/schema/users.js";

export function authenticate(...roles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedError();
    }

    const payload = verifyAccessToken(token);

    req.actor = {
      id: payload.sub,
      role: payload.role,
      displayName: payload.displayName,
    };

    if (roles.length > 0 && !roles.includes(payload.role)) {
      throw new ForbiddenError();
    }

    next();
  };
}
