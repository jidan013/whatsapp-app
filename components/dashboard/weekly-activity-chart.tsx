"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface WeeklyPoint {
  day: string;
  total: number;
}

export function WeeklyActivityChart({ data }: { data: WeeklyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barCategoryGap="28%">
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#64748b", fontSize: 12 }}
        />
        <YAxis hide allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "#eff6ff" }}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 12,
            boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
          }}
          labelStyle={{ color: "#0f172a", fontWeight: 600 }}
          formatter={(value) => [`${value} agenda`, ""]}
        />
        <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#bfdbfe" activeBar={{ fill: "#1d4ed8" }} />
      </BarChart>
    </ResponsiveContainer>
  );
}