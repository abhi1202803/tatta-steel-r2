import type { Alert } from "@/services/api";

const SEV_RGB: Record<string, string> = {
  critical: "var(--risk-critical-rgb)",
  high:     "var(--risk-high-rgb)",
  medium:   "var(--risk-medium-rgb)",
  low:      "var(--risk-low-rgb)",
};

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function AlertTimeline({ alerts }: { alerts: Alert[] }) {
  if (!alerts.length) return null;
  const sorted = [...alerts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 10);

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-panel-border">
        <h3 className="text-sm font-semibold text-steel-50">Alert Timeline</h3>
        <p className="text-[11px] text-steel-400 mt-0.5">Latest {sorted.length} events</p>
      </div>
      <div className="px-5 py-4 space-y-0 relative">
        {/* Vertical line */}
        <div className="absolute left-[2.35rem] top-4 bottom-4 w-px"
          style={{ background: "rgb(var(--panel-border-rgb))" }} />

        {sorted.map((alert, i) => {
          const rgb = SEV_RGB[alert.severity] || SEV_RGB.low;
          return (
            <div key={alert.id} className="flex gap-4 relative"
              style={{ paddingBottom: i < sorted.length - 1 ? "16px" : 0 }}>
              {/* Dot */}
              <div className="relative z-10 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                style={{
                  background: `rgb(${rgb}/0.15)`,
                  border: `2px solid rgb(${rgb})`,
                  boxShadow: `0 0 8px rgb(${rgb}/0.4)`,
                }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: `rgb(${rgb})` }} />
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="font-mono text-[11px] font-semibold text-accent-light">{alert.equipment_id}</span>
                  <span className="text-[9px] text-steel-500">{timeAgo(alert.timestamp)}</span>
                </div>
                <p className="text-xs text-steel-300 leading-snug">{alert.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
