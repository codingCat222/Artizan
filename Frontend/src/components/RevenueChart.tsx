import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RevenuePoint } from "../types/dashboard";

const formatNaira = (value: number) =>
  `₦${(value / 1000000).toFixed(1)}M`;

export default function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card border border-forest-100">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-forest-900">
            Revenue Collection
          </h3>
          <p className="text-sm text-forest-700/60">
            Collected vs expected facilitation fees
          </p>
        </div>
      </div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -10, right: 10, top: 10 }}>
            <defs>
              <linearGradient id="collected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#127A34" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#127A34" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8FD4A8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#8FD4A8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef3ef" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#4b5f52" }}
              axisLine={{ stroke: "#e2ebe4" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatNaira}
              tick={{ fontSize: 12, fill: "#4b5f52" }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              formatter={(value: number) => [formatNaira(value), ""]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #DDEBE3",
                fontSize: 13,
              }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
            />
            <Area
              type="monotone"
              dataKey="expected"
              name="Expected"
              stroke="#8FD4A8"
              fill="url(#expected)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="collected"
              name="Collected"
              stroke="#127A34"
              fill="url(#collected)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
