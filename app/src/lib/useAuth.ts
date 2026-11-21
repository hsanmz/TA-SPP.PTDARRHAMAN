import { useEffect, useState } from "react";
import { me, type AuthUser } from "@/lib/auth-functions";
import { getToken, onSessionChange } from "@/lib/session";

export type Role = "admin" | "parent" | "superadmin" | null;

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      const token = getToken();
      if (!token) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      try {
        const current = await me();
        if (active) setUser(current);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void refresh();
    const unsubscribe = onSessionChange(() => {
      setLoading(true);
      void refresh();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const role: Role = user?.role ?? null;
  return {
    user,
    role,
    loading,
    isAdmin: user?.isAdmin ?? false,
  };
}
