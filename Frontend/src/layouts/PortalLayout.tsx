import { Bell, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { NavItem, roleLabels } from "../router/navConfig";
import { homeFor, useAuth } from "../store/AuthContext";
import { useStore } from "../store/AppStore";
import { Role } from "../types/entities";

export default function PortalLayout({ nav, allow }: { nav: NavItem[]; allow: Exclude<Role, "PUBLIC">[] }) {
  const { session, logout } = useAuth();
  const { artisans } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Server-side checks are still required; this only keeps the UI honest.
  if (!session) return <Navigate to="/login" replace />;
  if (!allow.includes(session.role)) return <Navigate to={homeFor(session.role)} replace />;
  if (session.role === "ARTISAN") {
    const me = artisans.find((a) => a.id === session.artisanId);
    if (!me) {
      logout();
      return <Navigate to="/login" replace />;
    }
    if (me.mustChangePassword) return <Navigate to="/change-password" replace />;
  }

  const links = (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {nav.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={["/artisan", "/admin", "/association", "/super-admin"].includes(to)}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? "bg-forest-700 text-white shadow-sm" : "text-forest-700/70 hover:bg-forest-50 hover:text-forest-900"
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-3 border-b border-forest-100 px-6 py-5">
      <Logo className="h-12 w-auto" />
      <div>
        <p className="text-sm font-bold leading-tight text-forest-900">AAON Ogun State</p>
        <p className="text-xs text-forest-700/60">Chapter Portal</p>
      </div>
    </div>
  );

  const footer = (
    <div className="space-y-2 border-t border-forest-100 p-4">
      <div className="rounded-xl bg-forest-50 p-3 text-xs text-forest-700/70">
        Logged in as <span className="font-semibold text-forest-900">{roleLabels[session.role]}</span>
        {session.association && session.role === "ASSOCIATION_HEAD" && <div className="mt-0.5">{session.association}</div>}
      </div>
      <button
        onClick={() => { logout(); navigate("/"); }}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-forest-700/70 hover:bg-forest-50"
      >
        <LogOut size={14} /> Log out
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F3F8F5]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-forest-100 bg-white lg:flex">
        {brand}{links}{footer}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col bg-white">
            <button className="absolute right-3 top-3 rounded-lg p-1.5" onClick={() => setOpen(false)}><X size={18} /></button>
            {brand}{links}{footer}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-forest-100 bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 text-forest-800 lg:hidden" onClick={() => setOpen(true)} aria-label="Menu"><Menu size={22} /></button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-4">
            <button className="relative rounded-xl border border-forest-100 p-2.5 text-forest-700 hover:bg-forest-50" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-700 text-sm font-semibold text-white">{session.initials}</div>
              <div className="hidden text-sm sm:block">
                <p className="font-semibold text-forest-900">{session.name}</p>
                <p className="text-xs text-forest-700/60">{roleLabels[session.role]}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="space-y-6 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
