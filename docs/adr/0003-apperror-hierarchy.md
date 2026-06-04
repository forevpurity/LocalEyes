# ADR 3: AppError class hierarchy and global error middleware

Express error handling is standardised through an `AppError` class hierarchy and a global Express 5 error middleware, replacing ad-hoc per-handler `res.status().json()` calls.

## AppError hierarchy

| Class               | HTTP | Code                | When                                                  |
| ------------------- | ---- | ------------------- | ----------------------------------------------------- |
| `ValidationError`   | 400  | `VALIDATION_FAILED` | Zod parse failure                                     |
| `UnauthorizedError` | 401  | `UNAUTHORIZED`      | Missing/invalid JWT                                   |
| `ForbiddenError`    | 403  | `FORBIDDEN`         | Wrong role for the action                             |
| `NotFoundError`     | 404  | `NOT_FOUND`         | Resource does not exist                               |
| `ConflictError`     | 409  | `CONFLICT`          | Duplicate / unique_violation                          |
| `DomainRuleError`   | 422  | `DOMAIN_RULE`       | Business rule violated (e.g. voting on locked Report) |
| `RateLimitError`    | 429  | `RATE_LIMITED`      | Too many requests (slot reserved)                     |

All response bodies follow `{ error: { code, message, details? } }`. The error shape is defined as a Zod schema (`errorResponseSchema`) in `common/errors.ts`, ready for `zod-openapi` annotation per ADR 0003.

## Express 5

Express 5 is used instead of Express 4. Its headline feature — native async error propagation — eliminates the need for `express-async-errors` or `wrapAsync` wrappers. Any rejected promise in a handler automatically forwards to `next(err)`. The upgrade from Express 4 is a single version bump with no API changes to existing route handlers.

## Considered options

- **Library (`http-errors`, `boom`)** — adds a dependency for what is ~80 lines. The AppError hierarchy is trivial, custom, and doesn't need a library.
- **Keep Express 4 + `express-async-errors`** — Express 5 is stable and reduces external dependencies. The project is young enough (auth + health only) that migration cost is zero.
- **Return-and-handle pattern (no middleware)** — requires every handler to remember to call a helper; middleware catches everything automatically, including unexpected throws.

## Consequences

- All errors are caught centrally; no raw 500s leaking Postgres internals to clients
- Handlers throw `AppError` subtypes instead of calling `res.status().json()`
- `toAppError()` in `common/errors.ts` maps `pg.DatabaseError` codes (`23505` → `ConflictError`, `23503` → `DomainRuleError`) inside the global `errorHandler` middleware — no per-handler try/catch needed
- `notFoundHandler` catches unmatched routes with a standard 404 shape
- Response shape is fixed, making client-side error handling via Kubb (ADR 0003) deterministic
