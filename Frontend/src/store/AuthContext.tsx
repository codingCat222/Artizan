import { createContext, ReactNode, useContext, useState } from "react";
import { Role } from "../types/entities";
import { useStore } from "./AppStore";

export interface Session {
  role: Exclude<Role, "PUBLIC">;
  name: string;
  email: string;
  initials: string;
  artisanId?: string;
  association?: string;
}

interface Auth {
  session: Session | null;
  login: (identifier: string) => { ok: true; redirect: string } | { ok: false; error: string };
  logout: () => void;
}

const Ctx = createContext<Auth | null>(null);
const KEY = "aan-session";

export const homeFor = (r: Session["role"]) =>
  ({ ARTISAN: "/artisan", ADMIN: "/admin", ASSOCIATION_HEAD: "/association", SUPER_ADMIN: "/super-admin" })[r];

const initialsOf = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export function AuthProvider({ children }: { children: ReactNode }) {
  const { artisans, staff } = useStore();
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  });

  const save = (s: Session | null) => {
    setSession(s);
    try {
      if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
      else sessionStorage.removeItem(KEY);
    } catch { /* ignore */ }
  };

  const login: Auth["login"] = (identifier) => {
    const id = identifier.trim().toLowerCase();
    const bad = { ok: false as const, error: "Invalid email/username or password." };

    const u = staff.find((x) => x.email.toLowerCase() === id);
    if (u) {
      if (u.status === "Disabled") return { ok: false, error: "This account has been disabled. Contact the super administrator." };
      const s: Session = {
        role: u.role, name: u.name, email: u.email, initials: initialsOf(u.name), association: u.association,
      };
      save(s);
      return { ok: true, redirect: homeFor(u.role) };
    }

    const a = artisans.find((x) => x.email.toLowerCase() === id || x.id.toLowerCase() === id);
    if (a) {
      if (a.status === "Pending")
        return { ok: false, error: "This account has not been activated yet. Please use the activation link sent to your email." };
      if (a.status === "Suspended")
        return { ok: false, error: "This account has been suspended. Please contact your association." };
      save({ role: "ARTISAN", name: a.name, email: a.email, initials: a.avatarInitials, artisanId: a.id, association: a.association });
      return { ok: true, redirect: a.mustChangePassword ? "/change-password" : "/artisan" };
    }
    return bad;
  };

  return <Ctx.Provider value={{ session, login, logout: () => save(null) }}>{children}</Ctx.Provider>;
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
