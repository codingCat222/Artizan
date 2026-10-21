import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MembershipPoint } from "../types/dashboard";

export default function MembershipChart({ data }: { data: MembershipPoint[] }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card border border-forest-100">
      <div>
        <h3 className="text-base font-semibold text-forest-900">
          Membership Growth
        </h3>
        <p className="text-sm text-forest-700/60">
          Active vs overdue artisans by month
        </p>
      </div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef3ef" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#4b5f52" }}
              axisLine={{ stroke: "#e2ebe4" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#4b5f52" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
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
            <Bar
              dataKey="active"
              name="Active"
              fill="#127A34"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="overdue"
              name="Overdue"
              fill="#8FD4A8"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
