"use client";

import { apiClient } from "@/lib/api";
import type { User } from "@/lib/types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    accountType: "DIETITIAN" | "PATIENT"
  ) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);



export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const res = await apiClient.get<User>("/auth/me");
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void refreshMe().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await apiClient.post<User>("/auth/login", { email, password });
      if (res.success && res.data) {
        setUser(res.data);
        return {};
      }
      return { error: res.error ?? "Login failed." };
    } catch (e) {
      return { error: "Login failed." };
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, accountType: "DIETITIAN" | "PATIENT") => {
    const res = await apiClient.post<User>("/auth/register", { name, email, password, accountType });
    if (res.success && res.data) {
      return {};
    }
    return { error: res.error ?? "Registration failed." };
  },
  []);

  const logout = useCallback(async () => {
    await apiClient.post("/auth/logout");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshMe }),
    [user, loading, login, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
