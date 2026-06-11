import type { Response } from "express";
import {
  signAccessToken,
  signRefreshToken,
} from "../../common/token-utils.js";
import type { UserRole } from "../../db/schema/users.js";

const ACCESS_COOKIE_MAX_AGE = Number(
  process.env.ACCESS_TOKEN_MAX_AGE_MS ?? 15 * 60 * 1000,
);
const REFRESH_COOKIE_MAX_AGE = Number(
  process.env.REFRESH_TOKEN_MAX_AGE_MS ?? 7 * 24 * 60 * 60 * 1000,
);

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export function setAuthCookies(
  res: Response,
  user: { id: string; role: UserRole; displayName: string },
) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie("access_token", accessToken, {
    ...COOKIE_OPTIONS,
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });

  res.cookie("refresh_token", refreshToken, {
    ...COOKIE_OPTIONS,
    path: "/api/auth",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/api/auth" });
}
