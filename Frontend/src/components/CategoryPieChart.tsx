import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CategorySlice } from "../types/dashboard";

export default function CategoryPieChart({ data }: { data: CategorySlice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-card border border-forest-100">
      <div>
        <h3 className="text-base font-semibold text-forest-900">
          Artisans by Category
        </h3>
        <p className="text-sm text-forest-700/60">Share of total {total.toLocaleString()} registered</p>
      </div>
      <div className="mt-2 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
            >
              {data.map((slice) => (
                <Cell key={slice.name} fill={slice.color} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value} (${((value / total) * 100).toFixed(1)}%)`,
                name,
              ]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #DDEBE3",
                fontSize: 13,
              }}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              wrapperStyle={{ fontSize: 12.5, lineHeight: "22px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
