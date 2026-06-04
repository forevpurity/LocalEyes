import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import type { UserRole } from "../db/schema/users.js";

const ACCESS_EXPIRES_IN = (process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m") as jwt.SignOptions["expiresIn"];
const REFRESH_EXPIRES_IN = (process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"];

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
  displayName: string;
};

export type RefreshTokenPayload = {
  sub: string;
  jti: string;
};

export function signAccessToken(
  user: { id: string; role: UserRole; displayName: string }
): string {
  return jwt.sign(
    { sub: user.id, role: user.role, displayName: user.displayName },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

export function signRefreshToken(
  user: { id: string }
): string {
  return jwt.sign(
    { sub: user.id, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as RefreshTokenPayload;
}
