import type { Equipment } from "@/services/api";
import { ServerOff } from "lucide-react";

const HEALTH_RGB: Record<string, string> = {
  normal:   "var(--risk-low-rgb)",
  warning:  "var(--risk-medium-rgb)",
  anomaly:  "var(--risk-high-rgb)",
  critical: "var(--risk-critical-rgb)",
};

export default function EquipmentTable({ equipment }: { equipment: Equipment[] }) {
  if (!equipment.length) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <div className="empty-state-icon">
          <ServerOff className="w-7 h-7" />
        </div>
        <p className="empty-state-title">No equipment found</p>
        <p className="empty-state-desc">Equipment assets will appear here once connected to the monitoring system.</p>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-panel-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-steel-50">Equipment Summary</h3>
        <span className="text-[11px] font-medium text-steel-400 bg-panel-hover/50 px-2.5 py-1 rounded-lg">{equipment.length} assets</span>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {["Asset ID", "Name", "Type", "Location", "Health", "Anomaly", "RUL"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {equipment.map((eq) => {
              const rgb = HEALTH_RGB[eq.health_status] || HEALTH_RGB.normal;
              const anomalyPct = Math.round((eq.anomaly_score || 0) * 100);
              return (
                <tr key={eq.id}>
                  <td className="px-4 py-3 font-mono font-semibold text-accent-light">{eq.id}</td>
                  <td className="px-4 py-3 font-medium text-steel-100 max-w-[180px] truncate">{eq.name}</td>
                  <td className="px-4 py-3 text-steel-300">{eq.type}</td>
                  <td className="px-4 py-3 text-steel-400">{eq.location}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        background: `rgb(${rgb}/0.1)`,
                        color: `rgb(${rgb})`,
                        border: `1px solid rgb(${rgb}/0.25)`,
                      }}>
                      <span className={`w-1.5 h-1.5 rounded-full ${eq.health_status === "critical" ? "badge-dot-pulse" : ""}`} style={{ background: `rgb(${rgb})` }} />
                      {eq.health_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="flex-1 h-1.5 rounded-full bg-panel-border/60 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${anomalyPct}%`,
                            background: anomalyPct > 70 ? `rgb(var(--risk-critical-rgb))` : anomalyPct > 40 ? `rgb(var(--risk-medium-rgb))` : `rgb(var(--risk-low-rgb))`,
                          }} />
                      </div>
                      <span className="text-[10px] font-mono font-semibold w-8 text-right"
                        style={{ color: `rgb(${rgb})` }}>{anomalyPct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold tabular-nums text-steel-100">{eq.rul_days}</span>
                    <span className="text-steel-500 text-xs ml-0.5">d</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
