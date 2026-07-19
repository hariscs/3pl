// Typed fetch wrapper for the Lead API (/api/v1). Kept framework-agnostic so
// repository hooks and the store can share it.

import { clearSession, DEV_BYPASS_TOKEN, getToken } from "../token";
import { handleMockRequest } from "../mock-handlers";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const API_ROOT = `${BASE}/api/v1`;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// When the dev-mode login bypass is active the token is a sentinel value, not a
// real JWT — every API call will 401.  Suppress the redirect so the UI stays
// usable even when the backend is down.
function isDevBypass(): boolean {
  if (typeof window === "undefined") return false;
  return getToken() === DEV_BYPASS_TOKEN;
}

// Drop an expired/invalid session and bounce to the login page. Guarded so we
// don't loop when the 401 comes from the login request itself.
function handleUnauthorized(): void {
  if (isDevBypass()) return;
  clearSession();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // In dev-bypass mode, route everything through the in-memory mock handlers
  // so the full app works without a running API server.
  const mockRes = await handleMockRequest(
    init?.method ?? "GET",
    path,
    init?.body ? JSON.parse(init.body as string) : undefined,
  );
  if (mockRes) {
    if (!mockRes.ok) {
      let message = mockRes.statusText;
      try {
        const body = (await mockRes.json()) as { message?: string };
        if (body?.message) message = body.message;
      } catch {
        // non-JSON error body; keep statusText
      }
      throw new ApiError(mockRes.status, message);
    }
    if (mockRes.status === 204) return undefined as T;
    return (await mockRes.json()) as T;
  }

  // Only advertise a JSON body when we actually send one — otherwise Fastify
  // rejects bodyless POSTs (e.g. /toggle-archive) with FST_ERR_CTP_EMPTY_JSON_BODY.
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body !== undefined && init?.body !== null) {
    headers["content-type"] = "application/json";
  }

  const token = getToken();
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_ROOT}${path}`, { ...init, headers });

  if (res.status === 401) {
    handleUnauthorized();
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // non-JSON error body; keep statusText
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
};
