"use client";

interface PlantHealthGaugeProps {
  score: number; // 0-100
  size?: "sm" | "md" | "lg";
  label?: string;
  color?: string; // override auto-color from score
  className?: string;
}

const SIZES = {
  sm: { dim: 72, radius: 28, stroke: 5, valueFont: 14, labelFont: 7, labelOffset: 13 },
  md: { dim: 112, radius: 48, stroke: 7, valueFont: 22, labelFont: 8, labelOffset: 16 },
  lg: { dim: 130, radius: 54, stroke: 8, valueFont: 26, labelFont: 9, labelOffset: 18 },
} as const;

function scoreColor(s: number): string {
  if (s >= 80) return "rgb(34,197,94)";
  if (s >= 60) return "rgb(234,179,8)";
  if (s >= 40) return "rgb(249,115,22)";
  return "rgb(239,68,68)";
}

export default function PlantHealthGauge({
  score,
  size = "md",
  label = "HEALTH",
  color,
  className = "",
}: PlantHealthGaugeProps) {
  const { dim, radius, stroke, valueFont, labelFont, labelOffset } = SIZES[size];
  const center = dim / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const strokeColor = color || scoreColor(score);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgb(42,54,78)"
          strokeWidth={stroke}
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
        {/* Score text */}
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          fill="#f8fafc"
          fontSize={valueFont}
          fontWeight="700"
          fontFamily="'IBM Plex Mono', monospace"
        >
          {Math.round(score)}%
        </text>
        {/* Label */}
        <text
          x={center}
          y={center + labelOffset}
          textAnchor="middle"
          fill="rgb(148,163,184)"
          fontSize={labelFont}
          fontWeight="600"
          letterSpacing="0.12em"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}
