"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS: Record<string, string> = {
  low:      "rgb(var(--risk-low-rgb))",
  medium:   "rgb(var(--risk-medium-rgb))",
  high:     "rgb(var(--risk-high-rgb))",
  critical: "rgb(var(--risk-critical-rgb))",
};

interface Props {
  data: Record<string, number>;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-panel border border-panel-border rounded-lg px-3 py-2 text-xs shadow-ibm">
      <p className="text-steel-300 capitalize">{payload[0].name}</p>
      <p className="font-mono font-medium text-steel-50">{payload[0].value} assets</p>
    </div>
  );
};

export default function RiskDistributionChart({ data }: Props) {
  const chartData = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, key: name }));

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="card">
      <h3 className="section-title">Risk Distribution</h3>
      <div className="flex items-center gap-6">
        <div className="flex-shrink-0">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={COLORS[entry.key] || "rgb(var(--steel-500-rgb))"} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          <p className="text-xs text-steel-400 mb-4">
            <span className="text-2xl font-light text-steel-50">{total}</span>{" "}
            total assets
          </p>
          {chartData.map((d) => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
            const color = COLORS[d.key] || "rgb(var(--steel-500-rgb))";
            return (
              <div key={d.key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-steel-300 capitalize">{d.name}</span>
                  <span className="font-mono font-medium" style={{ color }}>{d.value} ({pct}%)</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgb(var(--panel-hover-rgb))" }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

