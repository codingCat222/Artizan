import { Link } from "react-router-dom";
import { RecentArtisan } from "../types/dashboard";

const statusStyles: Record<string, string> = {
  Active: "bg-fresh-50 text-fresh-600 border border-fresh-400/30",
  Overdue: "bg-red-50 text-red-600 border border-red-300",
  Pending: "bg-gold-400/10 text-gold-600 border border-gold-400/40",
};

export default function RecentArtisansTable({ rows, viewAllTo, hideAssociation }: { rows: RecentArtisan[]; viewAllTo: string; hideAssociation?: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card border border-forest-100">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-forest-900">
          Recently Registered Artisans
        </h3>
        <Link to={viewAllTo} className="text-sm font-medium text-forest-600 hover:text-forest-800">
          View all
        </Link>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-forest-100 text-forest-700/60">
              <th className="py-2.5 font-medium">ID</th>
              <th className="py-2.5 font-medium">Name</th>
              <th className="py-2.5 font-medium">Category</th>
              {!hideAssociation && <th className="py-2.5 font-medium">Association</th>}
              <th className="py-2.5 font-medium">Status</th>
              <th className="py-2.5 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-forest-50 last:border-0 hover:bg-forest-50/40"
              >
                <td className="py-3 font-medium text-forest-900">{row.id}</td>
                <td className="py-3 text-forest-800">{row.name}</td>
                <td className="py-3 text-forest-700/80">{row.category}</td>
                {!hideAssociation && <td className="py-3 text-forest-700/80">{row.association}</td>}
                <td className="py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[row.status] ?? statusStyles.Pending}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="py-3 text-forest-700/60">{row.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
