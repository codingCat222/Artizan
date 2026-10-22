import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { setAccessToken, setAuthFailureHandler } from "../lib/api";
import { authApi } from "../services/auth";
import { Role } from "../types/entities";

export interface Session {
  role: Exclude<Role, "PUBLIC">;
  name: string;
  email: string;
  initials: string;
  artisanId?: string;
  association?: string;
  /** Artisans must replace their temporary password before using the portal. */
  mustChangePassword?: boolean;
}

interface Auth {
  session: Session | null;
  /** True while the app is restoring a session on first load. */
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ ok: true; session: Session } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  /** Re-fetch the signed-in user (e.g. after a password change). */
  reload: () => Promise<void>;
}

const Ctx = createContext<Auth | null>(null);

export const homeFor = (r: Session["role"]) =>
  ({ ARTISAN: "/artisan", ADMIN: "/admin", ASSOCIATION_HEAD: "/association", SUPER_ADMIN: "/super-admin" })[r];

/** Where a signed-in user should land. */
export const landingFor = (s: Session) => (s.mustChangePassword ? "/change-password" : homeFor(s.role));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session from the refresh cookie when the app loads.
  useEffect(() => {
    let cancelled = false;
    authApi
      .restore()
      .then((s) => { if (!cancelled) setSession(s); })
      .catch(() => { if (!cancelled) setSession(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // If a request can't be refreshed any more, drop the session so guards redirect to /login.
  useEffect(() => {
    setAuthFailureHandler(() => setSession(null));
    return () => setAuthFailureHandler(null);
  }, []);

  const login: Auth["login"] = useCallback(async (identifier, password) => {
    try {
      const s = await authApi.login(identifier, password);
      setSession(s);
      return { ok: true, session: s };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Login failed." };
    }
  }, []);

  const logout = useCallback(async () => {
    setSession(null);
    setAccessToken(null);
    try { await authApi.logout(); } catch { /* cookie is cleared server-side on a best-effort basis */ }
  }, []);

  const reload = useCallback(async () => {
    try { setSession(await authApi.me()); } catch { /* auth-failure handler deals with 401s */ }
  }, []);

  return <Ctx.Provider value={{ session, loading, login, logout, reload }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}

/** Base path for shared staff pages (admin vs super admin). */
export function useBase() {
  const { session } = useAuth();
  return session?.role === "SUPER_ADMIN" ? "/super-admin" : session?.role === "ASSOCIATION_HEAD" ? "/association" : "/admin";
}