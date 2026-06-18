import type { RequestHandler } from "express";
import { verifyAccessToken } from "./token-utils.js";
import { UnauthorizedError, ForbiddenError } from "./errors.js";
import type { UserRole } from "../db/schema/users.js";
import { ensureNotBanned } from "../services/ban-users.js";

export function authenticate(...roles: UserRole[]): RequestHandler {
  return async (req, _res, next) => {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedError();
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError("Invalid or expired access token");
    }

    await ensureNotBanned(payload);

    req.actor = {
      id: payload.sub,
      role: payload.role,
      displayName: payload.displayName,
      avatarUrl: payload.avatarUrl,
    };

    if (roles.length > 0 && !roles.includes(payload.role)) {
      throw new ForbiddenError();
    }

    next();
  };
}

export function optionalAuthenticate(): RequestHandler {
  return async (req, _res, next) => {
    const token = req.cookies?.access_token;
    if (!token) {
      return next();
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError("Invalid or expired access token");
    }

    await ensureNotBanned(payload);

    req.actor = {
      id: payload.sub,
      role: payload.role,
      displayName: payload.displayName,
      avatarUrl: payload.avatarUrl,
    };

    next();
  };
}
