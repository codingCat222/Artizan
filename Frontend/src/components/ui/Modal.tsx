import { X } from "lucide-react";
import { ReactNode } from "react";

export default function Modal({
  open, onClose, title, subtitle, children, wide,
}: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className={`my-8 w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-2xl bg-white p-6 shadow-xl`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-forest-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-forest-700/60">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-forest-50" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
