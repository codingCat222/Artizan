import {
  AlertTriangle,
  Banknote,
  Building2,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { StatCardData } from "../types/dashboard";

const iconMap: Record<string, React.ElementType> = {
  users: Users,
  building: Building2,
  banknote: Banknote,
  "alert-triangle": AlertTriangle,
};

export default function StatCard({ data }: { data: StatCardData }) {
  const Icon = iconMap[data.icon] ?? Users;
  const isUp = data.trend === "up";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card border border-forest-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-forest-700/70">{data.label}</p>
          <p className="mt-2 text-2xl font-bold text-forest-900">{data.value}</p>
        </div>
        <div className="rounded-xl bg-forest-50 p-2.5 text-forest-600">
          <Icon size={20} />
        </div>
      </div>
      {data.delta ? (
        <div className="mt-4 flex items-center gap-1.5 text-sm">
          {isUp ? <TrendingUp size={16} className="text-fresh-500" /> : <TrendingDown size={16} className="text-red-500" />}
          <span className={isUp ? "font-semibold text-fresh-600" : "font-semibold text-red-500"}>{data.delta}</span>
          <span className="text-forest-700/50">vs last month</span>
        </div>
      ) : (
        data.hint && <p className="mt-4 text-sm text-forest-700/50">{data.hint}</p>
      )}
    </div>
  );
}
