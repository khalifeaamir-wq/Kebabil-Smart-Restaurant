import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

interface AuthState {
  loading: boolean;
  authenticated: boolean;
  user: AdminUser | null;
  login: (user: AdminUser) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const sbUser = data.user;

      if (sbUser) {
        setAuthenticated(true);
        setUser({
          id: sbUser.id,
          username: sbUser.email || "admin",
          displayName:
            (sbUser.user_metadata?.displayName as string | undefined) ||
            (sbUser.email ? sbUser.email.split("@")[0] : "Admin"),
          role: "admin",
        });
      } else {
        setAuthenticated(false);
        setUser(null);
      }
    } catch {
      setAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [checkAuth]);

  const login = useCallback((u: AdminUser) => {
    setAuthenticated(true);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
    setAuthenticated(false);
    setUser(null);
  }, []);

  return { loading, authenticated, user, login, logout, checkAuth };
}
