"use client";

interface ConfidenceGaugeProps {
  value: number; // 0-1
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { dim: 80, radius: 32, stroke: 6, fontSize: 16, labelSize: 8 },
  md: { dim: 100, radius: 40, stroke: 7, fontSize: 20, labelSize: 9 },
  lg: { dim: 140, radius: 58, stroke: 9, fontSize: 28, labelSize: 10 },
} as const;

function confidenceColor(v: number): string {
  if (v >= 0.8) return "rgb(34,197,94)";
  if (v >= 0.6) return "rgb(234,179,8)";
  if (v >= 0.4) return "rgb(249,115,22)";
  return "rgb(239,68,68)";
}

export default function ConfidenceGauge({
  value,
  size = "md",
  className = "",
}: ConfidenceGaugeProps) {
  const { dim, radius, stroke, fontSize, labelSize } = SIZES[size];
  const center = dim / 2;
  // Semi-circle: 180° arc
  const circumference = Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, value));
  const offset = circumference - clamped * circumference;
  const color = confidenceColor(clamped);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        width={dim}
        height={dim * 0.65}
        viewBox={`0 0 ${dim} ${dim * 0.65}`}
      >
        {/* Background arc (semi-circle from bottom-left to bottom-right) */}
        <path
          d={`M ${center - radius} ${dim * 0.6} A ${radius} ${radius} 0 0 1 ${center + radius} ${dim * 0.6}`}
          fill="none"
          stroke="rgb(42,54,78)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M ${center - radius} ${dim * 0.6} A ${radius} ${radius} 0 0 1 ${center + radius} ${dim * 0.6}`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
        {/* Percentage text */}
        <text
          x={center}
          y={dim * 0.5}
          textAnchor="middle"
          fill="#f8fafc"
          fontSize={fontSize}
          fontWeight="700"
          fontFamily="'IBM Plex Mono', monospace"
        >
          {Math.round(clamped * 100)}%
        </text>
        {/* Label */}
        <text
          x={center}
          y={dim * 0.5 + fontSize + 4}
          textAnchor="middle"
          fill="rgb(148,163,184)"
          fontSize={labelSize}
          fontWeight="600"
          letterSpacing="0.1em"
        >
          CONFIDENCE
        </text>
      </svg>
    </div>
  );
}
