interface HealthGaugeProps {
  value: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

function scoreColor(s: number): string {
  if (s >= 80) return "rgb(34,197,94)";
  if (s >= 60) return "rgb(234,179,8)";
  if (s >= 40) return "rgb(249,115,22)";
  return "rgb(239,68,68)";
}

export default function HealthGauge({ value, label = "Health", size = "md" }: HealthGaugeProps) {
  const pct = Math.round(value * 100);
  const dims = { sm: { dim: 72, r: 28, sw: 5, fs: 14, ls: 7, lo: 13 }, md: { dim: 100, r: 42, sw: 6, fs: 20, ls: 8, lo: 14 }, lg: { dim: 130, r: 54, sw: 8, fs: 26, ls: 9, lo: 18 } };
  const d = dims[size];
  const center = d.dim / 2;
  const circumference = 2 * Math.PI * d.r;
  const offset = circumference - (pct / 100) * circumference;
  const color = scoreColor(pct);

  return (
    <div className="card-hover flex flex-col items-center justify-center py-4">
      <svg width={d.dim} height={d.dim} viewBox={`0 0 ${d.dim} ${d.dim}`}>
        <circle cx={center} cy={center} r={d.r} fill="none" stroke="rgb(42,54,78)" strokeWidth={d.sw} />
        <circle cx={center} cy={center} r={d.r} fill="none" stroke={color} strokeWidth={d.sw}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }} />
        <text x={center} y={center - 2} textAnchor="middle" fill="#f8fafc" fontSize={d.fs} fontWeight="700" fontFamily="'IBM Plex Mono', monospace">{pct}%</text>
        <text x={center} y={center + d.lo} textAnchor="middle" fill="rgb(148,163,184)" fontSize={d.ls} fontWeight="600" letterSpacing="0.12em">{label.toUpperCase()}</text>
      </svg>
    </div>
  );
}
