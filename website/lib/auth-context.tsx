"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User, RegisterRequest } from "@/types/auth";
import { endpoints } from "@/config/endpoints";
import { apiClient, ApiError } from "@/lib/api-client";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isStaff: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      // First try to refresh the session (sets new access cookie if refresh cookie exists)
      const refreshRes = await fetch(endpoints.auth.refresh, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!refreshRes.ok) {
        setUser(null);
        return;
      }

      const data = await refreshRes.json();
      if (data.status === "success" && data.data) {
        setUser(data.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchUser().finally(() => setIsLoading(false));
  }, [fetchUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiClient.post<{ status: string; data: User; code?: string }>(
        endpoints.auth.login,
        { email, password },
      );
      if (res.status === "error") {
        throw new ApiError(401, res.code || "auth.invalid_credentials");
      }
      setUser(res.data);
    },
    [],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const res = await apiClient.post<{ status: string; data: User; code?: string }>(
        endpoints.auth.register,
        data,
      );
      if (res.status === "error") {
        throw new ApiError(400, res.code || "auth.registration_failed");
      }
      setUser(res.data);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post(endpoints.auth.logout, {});
    } catch {
      // Clear local state even if API call fails
    }
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      isEmailVerified: user?.is_email_verified ?? false,
      isStaff: user?.is_staff ?? false,
      login,
      register,
      logout,
      refreshUser,
      updateUser,
    }),
    [user, isLoading, login, register, logout, refreshUser, updateUser],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
