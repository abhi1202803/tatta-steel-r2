"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from "recharts";

interface Props {
  data: { timestamp: string; score: number }[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const color = val > 0.7 ? "rgb(var(--risk-critical-rgb))" : val > 0.4 ? "rgb(var(--risk-medium-rgb))" : "rgb(var(--risk-low-rgb))";
  return (
    <div className="bg-panel border border-panel-border rounded-lg px-3 py-2 text-xs shadow-ibm">
      <p className="text-steel-400 mb-1">{label}</p>
      <p className="font-mono font-medium" style={{ color }}>
        Anomaly: {(val * 100).toFixed(1)}%
      </p>
    </div>
  );
};

export default function AnomalyTrendChart({ data }: Props) {
  const hasData = data.length > 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title mb-0">Anomaly Score Trend</h3>
        {hasData && (
          <div className="flex items-center gap-3 text-[10px] text-steel-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-risk-low inline-block" />Normal</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-risk-medium inline-block" />Warning</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-risk-critical inline-block" />Critical</span>
          </div>
        )}
      </div>
      {!hasData ? (
        <div className="h-[220px] flex items-center justify-center text-steel-500 text-sm">
          No trend data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="rgb(var(--risk-medium-rgb))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="rgb(var(--risk-medium-rgb))" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--panel-border-rgb))" vertical={false} />
            <XAxis dataKey="timestamp" stroke="rgb(var(--steel-400-rgb))" fontSize={10} tickLine={false} />
            <YAxis stroke="rgb(var(--steel-400-rgb))" fontSize={10} domain={[0, 1]} tickLine={false} tickFormatter={(v) => `${(v*100).toFixed(0)}%`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0.7} stroke="rgb(var(--risk-critical-rgb))" strokeDasharray="4 4" strokeWidth={1} opacity={0.6} />
            <ReferenceLine y={0.4} stroke="rgb(var(--risk-medium-rgb))" strokeDasharray="4 4" strokeWidth={1} opacity={0.5} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="rgb(var(--risk-medium-rgb))"
              strokeWidth={2}
              fill="url(#anomalyGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "rgb(var(--risk-medium-rgb))", stroke: "rgb(var(--panel-bg-rgb))", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

