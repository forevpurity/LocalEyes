import { z } from "zod";
import { ValidationError } from "./errors.js";

export function parseAndValidate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fieldErrors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    throw new ValidationError("Validation failed", fieldErrors);
  }
  return result.data;
}
