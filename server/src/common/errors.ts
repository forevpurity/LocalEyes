import { z } from "zod";
import { DatabaseError } from "pg";
import { MulterError } from "multer";

const appErrorCodes = [
  "VALIDATION_FAILED",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "DOMAIN_RULE",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
  "ROUTE_NOT_FOUND",
] as const;

export type AppErrorCode = typeof appErrorCodes[number];

export interface FieldError {
  field: string;
  message: string;
}

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: AppErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: FieldError[]) {
    super(400, "VALIDATION_FAILED", message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(409, "CONFLICT", message);
  }
}

export class DomainRuleError extends AppError {
  constructor(message: string) {
    super(422, "DOMAIN_RULE", message);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests", retryAfterSeconds = 60) {
    super(429, "RATE_LIMITED", message, { retryAfterSeconds });
  }
}

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.enum(appErrorCodes),
    message: z.string(),
    details: z.unknown().optional(),
  }),
}).meta({ id: "ErrorResponse" });

export function toAppError(err: unknown): AppError | undefined {
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
