import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import Logo from "../components/Logo";
import { homeFor, useAuth } from "../store/AuthContext";
import { useEffect } from "react";

const links = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "Find Artisan", to: "/search-results" },
  { label: "Contact Us", to: "/contact" },
];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const { pathname } = useLocation();
  const loginTo = session ? homeFor(session.role) : "/login";
  const loginLabel = session ? "My Dashboard" : "Login";

  useEffect(() => { window.scrollTo(0, 0); setOpen(false); }, [pathname]);

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3.5 py-2 text-[15px] font-medium transition-colors ${
      isActive ? "text-forest-500" : "text-forest-800 hover:text-forest-500"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-forest-50">
      <header className="sticky top-0 z-30 border-b border-forest-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-2.5 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <Logo className="h-14 w-auto" />
            <div className="hidden leading-tight sm:block">
              <p className="text-base font-bold text-forest-800">AAON Ogun State</p>
              <p className="text-xs text-forest-600/70">Artisans… For Better Life</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === "/"} className={navCls}>{l.label}</NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to={loginTo}
              className="rounded-xl bg-forest-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-forest-500"
            >
              {loginLabel}
            </Link>
            <button className="rounded-lg p-2 text-forest-800 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {open && (
          <div className="border-t border-forest-100 bg-white px-5 py-3 lg:hidden">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === "/"} onClick={() => setOpen(false)}
                className={({ isActive }) => `block rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? "bg-forest-50 text-forest-500" : "text-forest-800"}`}>
                {l.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-forest-800 text-forest-100/80">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="inline-flex rounded-full bg-white p-1.5"><Logo className="h-20 w-20" /></div>
            <p className="mt-4 text-sm leading-relaxed">Representing artisans. Promoting skills. Supporting enterprise across Ogun State.</p>
            <p className="mt-4 text-xs uppercase tracking-wide text-forest-300">State President</p>
            <p className="text-sm font-semibold text-white">Comrade Anthony Ayodele</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Quick Links</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {links.map((l) => <li key={l.to}><Link to={l.to} className="hover:text-mint">{l.label}</Link></li>)}
              <li><Link to={loginTo} className="hover:text-mint">{loginLabel}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Our Priorities</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {["Representing artisans' interests", "Skills and quality workmanship", "Collaboration with partners", "Enterprise and employment", "Cooperation among LGA chapters"].map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Contact Information</p>
            <p className="mt-4 text-sm leading-relaxed">
              Artisans Association of Nigeria (AAON), Ogun State Chapter. Official office address, phone number and email are to be confirmed.
            </p>
            <Link to="/contact" className="mt-4 inline-block rounded-xl bg-mint px-4 py-2 text-sm font-semibold text-forest-800 hover:bg-forest-300">Contact Us</Link>
          </div>
        </div>
        <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-forest-100/60">
          Artisans… For Better Life!!! · © 2026 AAON Ogun State Chapter. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
