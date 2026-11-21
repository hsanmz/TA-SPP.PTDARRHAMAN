export const API_BASE = (
  typeof process !== "undefined" && process.env?.["VITE_API_URL"]
    ? process.env["VITE_API_URL"]
    : ""
).replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(endpoint: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
  if (!(opts.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const res = await fetch(url, { ...opts, headers });

  if (!res.ok) {
    let msg = `API ${res.status}`;
    try {
      const body = await res.json();
      if (body && typeof body === "object" && "detail" in body) {
        msg = String(body.detail);
      }
    } catch {
      msg = res.statusText || msg;
    }
    throw new ApiError(msg, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiFetchBlob(endpoint: string, opts: RequestInit = {}): Promise<Blob> {
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const res = await fetch(url, { ...opts, headers });

  if (!res.ok) {
    throw new ApiError(`API ${res.status}`, res.status);
  }
  return res.blob();
}
