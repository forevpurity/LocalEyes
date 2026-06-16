import rateLimit, { type Options } from "express-rate-limit";
import { RateLimitError } from "./errors.js";

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes

const GLOBAL_MAX = Number(process.env.RATE_LIMIT_GLOBAL_MAX) || 100;
const AUTH_MAX = Number(process.env.RATE_LIMIT_AUTH_MAX) || 10;
const REPORT_CREATE_MAX = Number(process.env.RATE_LIMIT_REPORT_CREATE_MAX) || 5;

function createLimiter(
  max: number,
  message = "Too many requests",
): ReturnType<typeof rateLimit> {
  const options: Partial<Options> = {
    windowMs: WINDOW_MS,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, _next, opts) => {
      throw new RateLimitError(
        message,
        Math.ceil((opts.windowMs ?? WINDOW_MS) / 1000),
      );
    },
  };

  if (process.env.NODE_ENV === "test") {
    options.skip = () => true;
  }

  return rateLimit(options);
}

/** 100 requests per window — applied to all /api routes. */
export const globalLimiter = createLimiter(GLOBAL_MAX);

/** 10 requests per window — applied to login, register, and refresh. */
export const authLimiter = createLimiter(
  AUTH_MAX,
  "Too many authentication attempts",
);

/** 5 requests per window — applied to POST /api/reports. */
export const reportCreateLimiter = createLimiter(
  REPORT_CREATE_MAX,
  "Too many reports submitted",
);
