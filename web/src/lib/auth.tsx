"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "./api/client";
import {
  clearSession,
  DEV_BYPASS_TOKEN,
  getStoredUser,
  getToken,
  storeSession,
} from "./token";
import type { SystemUser } from "./types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type LoginResponse = { token: string; user: SystemUser };

type AuthContextValue = {
  user: SystemUser | null;
  status: AuthStatus;
  /** Log in with email + password. Throws (ApiError) on failure. */
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DEV_MODE = process.env.NODE_ENV === "development";

const DEV_USER: SystemUser = {
  id: "user-dev",
  firstName: "David",
  lastName: "Miller",
  email: "dev@localhost",
  role: "admin",
  status: "active",
  locationIds: [],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SystemUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Restore a persisted session on first mount (localStorage is client-only,
  // so this runs after hydration).  In dev mode, skip the login screen entirely
  // by seeding a dummy admin session so you can work without the API running.
  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();
    if (token && storedUser) {
      setUser(storedUser);
      setStatus("authenticated");
    } else if (DEV_MODE) {
      storeSession(DEV_BYPASS_TOKEN, DEV_USER);
      setUser(DEV_USER);
      setStatus("authenticated");
    } else {
      setStatus("unauthenticated");
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: loggedIn } = await api.post<LoginResponse>(
      "/auth/login",
      { email, password },
    );
    storeSession(token, loggedIn);
    setUser(loggedIn);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    clearSession();
    queryClient.clear(); // drop the previous user's cached data
    setUser(null);
    setStatus("unauthenticated");
    // In dev mode, the bypass re-seeds itself on next mount, so stay on /login
    // to make it easy to log in with a real account later.
    router.replace("/login");
  }, [router, queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
