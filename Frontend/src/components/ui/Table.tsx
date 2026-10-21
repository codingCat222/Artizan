import { ReactNode } from "react";

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <th className={`px-5 py-3 font-medium ${className}`}>{children}</th>;
}
export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-5 py-3 ${className}`}>{children}</td>;
}
export function Table({ head, children, min = 700 }: { head: ReactNode; children: ReactNode; min?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth: min }}>
        <thead><tr className="border-b border-forest-100 text-forest-700/60">{head}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
export const rowCls = "border-b border-forest-50 last:border-0 hover:bg-forest-50/40";
