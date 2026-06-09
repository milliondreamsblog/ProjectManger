import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import type { Role, Permission } from "@pm/config";
import { api, TOKEN_KEY, setOnUnauthorized } from "../lib/api";

const USER_KEY = "pm_user";

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  permissions: Permission[];
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (p: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
    setUser(null);
  }, []);

  // Hydrate stored session on launch + wire 401 -> logout.
  useEffect(() => {
    setOnUnauthorized(() => {
      void logout();
    });
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(USER_KEY);
        if (raw) setUser(JSON.parse(raw) as AuthUser);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    const next: AuthUser = {
      id: res.id,
      name: res.name,
      role: res.role,
      permissions: res.permissions ?? [],
    };
    await SecureStore.setItemAsync(TOKEN_KEY, res.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(next));
    setUser(next);
  }, []);

  const hasPermission = useCallback(
    (p: Permission) => user?.role === "admin" || (user?.permissions ?? []).includes(p),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
