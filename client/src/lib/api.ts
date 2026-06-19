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

/**
 * Reads `retryAfterSeconds` from a rate-limit (429) error. The server sends it
 * inside `error.details`, which is otherwise field→messages; cast locally so we
 * don't loosen the type used by form field-mapping.
 */
export function getRetryAfterSeconds(err: ApiRequestError): number | undefined {
  const value = (err.details as Record<string, unknown> | undefined)
    ?.retryAfterSeconds;
  return typeof value === "number" ? value : undefined;
}

async function parseErrorResponse(res: Response) {
  const err = await res.json().catch(() => ({}));
  return new ApiRequestError(
    res.status,
    err.error?.code ?? "UNKNOWN",
    err.error?.message ?? "Request failed",
    err.error?.details,
  );
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const res = await fetch(url, { ...options, credentials: "include" });

  if (res.status === 401) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      const retryRes = await fetch(url, {
        ...options,
        credentials: "include",
      });
      if (!retryRes.ok) {
        throw await parseErrorResponse(retryRes);
      }
      return retryRes;
    }
  }

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  return res;
}

type ApiOptions = Omit<RequestInit, "body"> & { json?: unknown };

export async function api<T>(path: string, options?: ApiOptions): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const { json, headers, ...rest } = options ?? {};
  const res = await fetchWithAuth(url, {
    ...rest,
    headers: { "Content-Type": "application/json", ...headers },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetchWithAuth(url, {
    method: "POST",
    body: formData,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}
