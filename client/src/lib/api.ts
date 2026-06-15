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

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetchWithAuth(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
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
