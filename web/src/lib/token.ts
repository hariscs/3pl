// Persistent auth storage for the dashboard. Kept dependency-free so both the
// API client and the auth provider can use it without an import cycle.

import type { SystemUser } from "./types";

const TOKEN_KEY = "dockmaster.token";
const USER_KEY = "dockmaster.user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): SystemUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SystemUser;
  } catch {
    return null;
  }
}

export function storeSession(token: string, user: SystemUser): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}
