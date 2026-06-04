import type { Request, Response, NextFunction } from "express";
import { AppError, NotFoundError, toAppError } from "./errors.js";

export function errorHandler(
  errRaw: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const err = toAppError(errRaw) ?? errRaw;

  if (err instanceof AppError) {
    if (err.status < 500) {
      console.warn(JSON.stringify({
        level: "warn",
        status: err.status,
        code: err.code,
        message: err.message,
        method: req.method,
        path: req.path,
      }));
    } else {
      console.error(JSON.stringify({
        level: "error",
        status: err.status,
        code: err.code,
        message: err.message,
        stack: err.stack,
        method: req.method,
        path: req.path,
      }));
    }

    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  console.error(JSON.stringify({
    level: "error",
    message: err instanceof Error ? err.message : "Unknown error",
    stack: err instanceof Error ? err.stack : undefined,
    method: req.method,
    path: req.path,
  }));

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    },
  });
}

export function notFoundHandler(_req: Request, _res: Response) {
  throw new NotFoundError("Route not found");
}
