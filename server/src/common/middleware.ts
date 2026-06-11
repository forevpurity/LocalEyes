import type { Request, Response, NextFunction } from "express";
import { DatabaseError } from "pg";
import { MulterError } from "multer";
import {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  DomainRuleError,
} from "./errors.js";

function toAppError(err: unknown): AppError | undefined {
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
      return new ValidationError("Too many files", [
        { field: "photos", message: "A maximum of 5 photos are allowed" },
      ]);
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return new ValidationError("File too large", [
        { field: "photos", message: "Each photo must be smaller than 5 MB" },
      ]);
    }
    return new ValidationError(err.message);
  }
  if (err instanceof DatabaseError) {
    if (err.code === "23505") {
      return new ConflictError(err.message ?? "Resource already exists");
    }
    if (err.code === "23503") {
      return new DomainRuleError(err.message ?? "Referenced resource does not exist");
    }
  }
  if (err instanceof AppError) return err;
  return undefined;
}

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
