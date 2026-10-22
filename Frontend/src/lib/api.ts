/**
 * Tiny fetch wrapper for the backend API.
 *
 * - The short-lived access token lives only in memory (never localStorage), so
 *   XSS can't steal a long-lived credential.
 * - The long-lived refresh token is an httpOnly cookie managed by the server.
 * - On a 401 the client silently refreshes once and retries the request.
 */
const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let accessToken: string | null = null;
let onAuthFailure: (() => void) | null = null;

export const setAccessToken = (t: string | null) => { accessToken = t; };
export const getAccessToken = () => accessToken;
/** Called when a session can no longer be refreshed (expired / revoked). */
export const setAuthFailureHandler = (fn: (() => void) | null) => { onAuthFailure = fn; };

interface Options {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Send the access token (default true). */
  auth?: boolean;
}

async function rawRequest(path: string, { method = "GET", body, auth = true }: Options): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  try {
    return await fetch(`${BASE}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError((data && (data.error as string)) || "Something went wrong. Please try again.", res.status);
  }
  return data as T;
}

// One refresh at a time: the server rotates refresh tokens, so two parallel
// refreshes with the same cookie would make the second one fail.
let refreshing: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = (async () => {
      const res = await rawRequest("/auth/refresh", { method: "POST", auth: false });
      if (!res.ok) {
        accessToken = null;
        return null;
      }
      const data = (await res.json()) as { accessToken: string };
      accessToken = data.accessToken;
      return accessToken;
    })().finally(() => { refreshing = null; });
  }
  return refreshing;
}

export async function api<T = unknown>(path: string, options: Options = {}): Promise<T> {
  let res = await rawRequest(path, options);

  if (res.status === 401 && options.auth !== false) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      res = await rawRequest(path, options);
    } else {
      onAuthFailure?.();
    }
  }
  return parse<T>(res);
}