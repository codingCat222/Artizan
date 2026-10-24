import { ReactNode } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F8F5] px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-forest-100 bg-white p-8 shadow-card">
        <Link to="/" className="flex items-center gap-3">
          <Logo className="h-14 w-auto" />
          <div>
            <p className="font-bold text-forest-900">{title}</p>
            <p className="text-xs text-forest-700/60">{subtitle ?? "Artisans Association of Ogun"}</p>
          </div>
        </Link>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}