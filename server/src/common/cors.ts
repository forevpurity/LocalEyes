import type { CorsOptions } from "cors";

// Allowed cross-origin sources. Set CORS_ORIGIN to a comma-separated list of
// origins (e.g. "https://localeyes.vn,https://www.localeyes.vn") in production.
// When unset, the request origin is reflected back — convenient for local dev,
// where the client is same-origin via the Vite proxy.
const allowList = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// `origin` is either the explicit allow-list, or `true` (reflect any origin)
// when CORS_ORIGIN is unset. credentials:true is required for the cookie-based
// JWT auth to work cross-origin.
export const corsOptions: CorsOptions = {
  origin: allowList.length > 0 ? allowList : true,
  credentials: true,
};
