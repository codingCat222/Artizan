import { ReactNode } from "react";

const tones = {
  info: "border-forest-100 bg-forest-50 text-forest-800",
  warn: "border-gold-400/40 bg-gold-400/10 text-gold-600",
  error: "border-red-300 bg-red-50 text-red-600",
  success: "border-fresh-400/30 bg-fresh-50 text-fresh-600",
};

export default function Notice({ tone = "info", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}
