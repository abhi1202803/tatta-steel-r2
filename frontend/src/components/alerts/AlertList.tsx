import type { Alert } from "@/services/api";
import { AlertTriangle, ShieldAlert, Bell, CheckCircle2, Clock } from "lucide-react";

const SEV: Record<string, { rgb: string; icon: typeof Bell }> = {
  critical: { rgb: "var(--risk-critical-rgb)", icon: ShieldAlert },
  high:     { rgb: "var(--risk-high-rgb)",     icon: AlertTriangle },
  medium:   { rgb: "var(--risk-medium-rgb)",   icon: Bell },
  low:      { rgb: "var(--risk-low-rgb)",       icon: CheckCircle2 },
};

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function AlertList({ alerts }: { alerts: Alert[] }) {
  if (!alerts.length) {
    return (
      <div className="card flex flex-col items-center justify-center py-14 text-center">
        <CheckCircle2 className="w-9 h-9 mb-3 opacity-40" style={{ color: "rgb(var(--risk-low-rgb))" }} />
        <p className="text-steel-400 text-sm font-medium">No active alerts</p>
        <p className="text-steel-500 text-xs mt-1">All equipment operating normally</p>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-panel-border">
        <h3 className="text-sm font-semibold text-steel-50">Active Alerts</h3>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md border border-panel-border text-steel-400"
          style={{ background: "rgb(var(--panel-hover-rgb)/0.6)" }}>
          {alerts.length} total
        </span>
      </div>
      <div className="space-y-px max-h-[420px] overflow-y-auto">
        {alerts.map((alert) => {
          const s = SEV[alert.severity] || SEV.low;
          const Icon = s.icon;
          return (
            <div
              key={alert.id}
              data-alert-id={alert.id}
              className="flex items-start gap-3 px-4 py-3 hover:bg-panel-hover/50 transition-colors group cursor-pointer"
              style={{ borderLeft: `3px solid rgb(${s.rgb}/0.7)` }}
            >
              <div className="p-1.5 rounded-md shrink-0 mt-0.5"
                style={{ background: `rgb(${s.rgb}/0.1)` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: `rgb(${s.rgb})` }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-[11px] font-semibold text-accent-light">{alert.equipment_id}</span>
                  <span className="text-[10px] uppercase tracking-wide font-bold"
                    style={{ color: `rgb(${s.rgb})` }}>{alert.severity}</span>
                </div>
                <p className="text-xs text-steel-200 leading-snug">{alert.message}</p>
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-steel-500">
                  <Clock className="w-2.5 h-2.5" />
                  {timeAgo(alert.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
