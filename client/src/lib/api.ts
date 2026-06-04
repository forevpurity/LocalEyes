const BASE = "/api";

let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    }).then((res) => res.ok);
  }
  const ok = await refreshPromise;
  refreshPromise = null;
  return ok;
}

export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: Record<string, string[]>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  if (res.status === 401) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      const retryRes = await fetch(url, {
        ...options,
        credentials: "include",
        headers: { "Content-Type": "application/json", ...options?.headers },
      });
      if (retryRes.ok) return retryRes.json();
      const retryError = await retryRes.json().catch(() => ({}));
      throw new ApiRequestError(
        retryRes.status,
        retryError.error?.code ?? "UNKNOWN",
        retryError.error?.message ?? "Request failed",
        retryError.error?.details,
      );
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiRequestError(
      res.status,
      err.error?.code ?? "UNKNOWN",
      err.error?.message ?? "Request failed",
      err.error?.details,
    );
  }

  return res.json();
}
