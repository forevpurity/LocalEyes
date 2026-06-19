// Fail-fast environment validation. Run once at startup (see index.ts) so a
// misconfigured deploy crashes on boot with a clear message instead of throwing
// an opaque 500 on the first login / DB query.

// Variables with no safe default — the app cannot function without them.
const REQUIRED = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
] as const;

const PLACEHOLDER = "change-me";
const MIN_SECRET_LENGTH = 32;

export function validateEnv(): void {
  const missing = REQUIRED.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    fail(
      `Missing required environment variable(s): ${missing.join(", ")}.`,
      "Set them in server/.env (see server/.env.example) before starting the server.",
    );
  }

  // Stricter checks for production: a placeholder or weak secret leaking into a
  // real deploy is a security hole, not just a misconfiguration.
  if (process.env.NODE_ENV === "production") {
    const problems: string[] = [];

    for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const) {
      const value = process.env[key]!;
      if (value.includes(PLACEHOLDER)) {
        problems.push(`${key} is still set to the example placeholder.`);
      } else if (value.length < MIN_SECRET_LENGTH) {
        problems.push(
          `${key} is too short (<${MIN_SECRET_LENGTH} chars); use a long random secret.`,
        );
      }
    }

    if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
      problems.push("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ.");
    }

    // Without an explicit allow-list, CORS reflects any request origin with
    // credentials:true — letting any site make authenticated requests on behalf
    // of a logged-in user. Acceptable for local dev, a security hole in prod.
    if (!process.env.CORS_ORIGIN?.trim()) {
      problems.push(
        "CORS_ORIGIN is unset; set it to a comma-separated list of allowed origins " +
          "(e.g. https://localeyes.vn,https://www.localeyes.vn).",
      );
    }

    if (problems.length > 0) {
      fail("Insecure configuration for NODE_ENV=production:", ...problems);
    }
  }
}

function fail(...lines: string[]): never {
  console.error(`[env] ${lines[0]}`);
  for (const line of lines.slice(1)) console.error(`[env]   - ${line}`);
  process.exit(1);
}
