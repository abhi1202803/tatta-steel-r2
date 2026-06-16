"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface RULChartProps {
  data: { day: string; rul: number }[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p className="chart-tooltip-value">RUL: {payload[0].value} days</p>
    </div>
  );
};

export default function RULChart({ data }: RULChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--panel-border-rgb))" vertical={false} />
        <XAxis dataKey="day" stroke="rgb(var(--steel-400-rgb))" fontSize={10} tickLine={false} />
        <YAxis stroke="rgb(var(--steel-400-rgb))" fontSize={10} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="rul" stroke="rgb(var(--steel-accent-rgb))" strokeWidth={2} dot={false}
          activeDot={{ r: 4, fill: "rgb(var(--steel-accent-rgb))", stroke: "rgb(var(--panel-bg-rgb))", strokeWidth: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
