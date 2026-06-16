"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SensorSparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function SensorSparkline({
  data,
  color = "rgb(59,130,246)",
  width = 80,
  height = 32,
  className = "",
}: SensorSparklineProps) {
  if (!data.length) {
    return (
      <div
        className={`flex items-center justify-center text-[9px] text-steel-500 ${className}`}
        style={{ width, height }}
      >
        —
      </div>
    );
  }

  const chartData = data.map((v, i) => ({ i, v }));

  return (
    <div className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 1, right: 1, bottom: 1, left: 1 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
