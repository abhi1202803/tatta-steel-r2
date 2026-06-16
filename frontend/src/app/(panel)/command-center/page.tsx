"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { api, type CommandCenterData, type ZoneHealthItem, type EquipmentHealthRanking } from "@/services/api";
import { toast } from "sonner";
import {
  Zap, AlertTriangle, Wrench, Clock, Package, TrendingUp, Activity,
  Cpu, Gauge, ShieldAlert, RefreshCw, ChevronRight, Brain,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const ExecutiveInsightsPanel = dynamic(() => import("@/components/insights/ExecutiveInsightsPanel"), {
  loading: () => <div className="card animate-pulse h-48" />,
});

const CHART_GRID = "rgb(42,54,78)";
const CHART_TEXT = "rgb(148,163,184)";

// ── Plant Health Gauge ──
function PlantHealthGauge({ score }: { score: number }) {
  const color = score >= 80 ? "rgb(34,197,94)" : score >= 60 ? "rgb(234,179,8)" : score >= 40 ? "rgb(249,115,22)" : "rgb(239,68,68)";
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle cx="75" cy="75" r={radius} fill="none" stroke="rgb(42,54,78)" strokeWidth="10" />
        <circle cx="75" cy="75" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 75 75)"
          style={{ transition: "stroke-dashoffset 1.5s ease", filter: `drop-shadow(0 0 8px ${color})` }} />
        <text x="75" y="72" textAnchor="middle" fill="#f8fafc" fontSize="28" fontWeight="800">{score}</text>
        <text x="75" y="92" textAnchor="middle" fill="rgb(148,163,184)" fontSize="10">PLANT HEALTH</text>
        <text x="75" y="105" textAnchor="middle" fill={color} fontSize="9" fontWeight="600">
          {score >= 80 ? "OPTIMAL" : score >= 60 ? "WARNING" : score >= 40 ? "DEGRADED" : "CRITICAL"}
        </text>
      </svg>
    </div>
  );
}

// ── Zone Health Heatmap ──
function ZoneHealthHeatmap({ zones, onSelect }: { zones: ZoneHealthItem[]; onSelect?: (zone: string) => void }) {
  if (!zones.length) {
    return (
      <div className="card text-center py-8">
        <Cpu className="w-6 h-6 text-steel-600 mx-auto mb-2" />
        <p className="text-xs text-steel-500">No zone data available</p>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-panel-border">
        <h3 className="text-sm font-semibold text-steel-100 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-accent" />
          Plant Zone Health Heatmap
        </h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {zones.map((zone) => {
            const color = zone.avg_health >= 80 ? "rgb(34,197,94)" : zone.avg_health >= 60 ? "rgb(234,179,8)" : zone.avg_health >= 40 ? "rgb(249,115,22)" : "rgb(239,68,68)";
            const bgOpacity = zone.avg_health >= 80 ? 0.15 : zone.avg_health >= 60 ? 0.15 : zone.avg_health >= 40 ? 0.2 : 0.25;
            return (
              <button
                key={zone.zone}
                type="button"
                className="rounded-xl p-4 border border-panel-border hover:border-accent/40 transition-all text-left relative overflow-hidden group"
                style={{ backgroundColor: `${color}0D` }}
                onClick={() => onSelect?.(zone.zone)}
              >
                {/* Heat indicator */}
                <div
                  className="absolute inset-0 rounded-xl transition-opacity"
                  style={{ backgroundColor: color, opacity: bgOpacity }}
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-steel-200 uppercase tracking-wider truncate">{zone.zone}</span>
                    {zone.critical_count > 0 && (
                      <span className="w-2 h-2 rounded-full bg-risk-critical animate-pulse" />
                    )}
                  </div>
                  <p className="text-2xl font-bold" style={{ color }}>{zone.avg_health}%</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px]">
                    <span className="text-steel-400">{zone.equipment_count} assets</span>
                    {zone.critical_count > 0 && (
                      <span className="text-risk-critical font-semibold">{zone.critical_count} critical</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Critical Asset Board ──
function CriticalAssetBoard({ assets }: { assets: EquipmentHealthRanking[] }) {
  if (!assets.length) {
    return (
      <div className="card text-center py-6">
        <ShieldAlert className="w-6 h-6 text-steel-600 mx-auto mb-2" />
        <p className="text-xs text-steel-500">No critical assets</p>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-panel-border flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-risk-critical" />
        <h3 className="text-sm font-semibold text-steel-100">Critical Asset Monitoring</h3>
        <span className="ml-auto badge text-[9px] bg-risk-critical/10 text-risk-critical border border-risk-critical/20">
          {assets.length} assets
        </span>
      </div>
      <div className="divide-y divide-panel-border max-h-[400px] overflow-y-auto">
        {assets.map((asset) => {
          const color = asset.health_score >= 80 ? "text-risk-low" : asset.health_score >= 60 ? "text-risk-medium" : asset.health_score >= 40 ? "text-risk-high" : "text-risk-critical";
          const barColor = asset.health_score >= 80 ? "rgb(34,197,94)" : asset.health_score >= 60 ? "rgb(234,179,8)" : asset.health_score >= 40 ? "rgb(249,115,22)" : "rgb(239,68,68)";
          return (
            <div key={asset.id} className="px-4 py-3 hover:bg-steel-800/40 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium text-steel-200 truncate">{asset.name}</span>
                  <span className={`text-[9px] uppercase font-semibold ${color}`}>{asset.risk_level}</span>
                </div>
                <span className="text-[10px] text-steel-500">{asset.rul_days}d RUL</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-steel-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${asset.health_score}%`, backgroundColor: barColor }} />
                </div>
                <span className="text-[10px] font-mono text-steel-400 w-10 text-right">{asset.health_score}%</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[9px]">
                <span className="text-steel-500">{asset.type}</span>
                {asset.anomaly_score > 0.5 && (
                  <span className="text-risk-high">Anomaly: {Math.round(asset.anomaly_score * 100)}%</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── KPI History Chart ──
function KpiHistoryChart({ data }: { data: { timestamp: string; health: number; alerts: number; downtime: number }[] }) {
  if (!data.length) return null;
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-panel-border">
        <h3 className="text-sm font-semibold text-steel-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          Operational KPI Trends (7-Day)
        </h3>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tick={{ fill: CHART_TEXT, fontSize: 9 }} tickFormatter={(v: string) => v.slice(5)} />
            <YAxis tick={{ fill: CHART_TEXT, fontSize: 9 }} />
            <Tooltip
              contentStyle={{ background: "rgb(30,41,59)", border: "1px solid rgb(51,65,85)", borderRadius: "8px", fontSize: "11px" }}
              labelStyle={{ color: "rgb(203,213,225)" }}
            />
            <Bar dataKey="health" fill="rgb(34,197,94)" radius={[2, 2, 0, 0]} name="Health" />
            <Bar dataKey="alerts" fill="rgb(239,68,68)" radius={[2, 2, 0, 0]} name="Alerts" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Live Status Card ──
function LiveStatusCard({ label, value, unit, icon: Icon, color, sub }: {
  label: string; value: number | string; unit?: string; icon: typeof Zap; color: string; sub?: string;
}) {
  return (
    <div className="card-hover flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border`}
        style={{ backgroundColor: `${color}1A`, borderColor: `${color}33` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-steel-400">{label}</p>
        <p className="text-xl font-bold text-steel-50">
          {value}
          {unit && <span className="text-sm text-steel-400 ml-1">{unit}</span>}
        </p>
        {sub && <p className="text-[10px] text-steel-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function CommandCenterPage() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  const loadData = useCallback(() => {
    api.getCommandCenterData()
      .then(d => {
        setData(d);
        setLastUpdated(new Date().toLocaleTimeString());
        toast.success("Command Center refreshed");
      })
      .catch(() => {
        setData(null);
        toast.error("Failed to load Command Center data");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-title w-72 h-8 mb-2" />
        <div className="skeleton skeleton-text w-96 h-4 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card space-y-3 py-4">
              <div className="skeleton skeleton-circle w-10 h-10 mx-auto" />
              <div className="skeleton skeleton-text w-16 h-5 mx-auto" />
              <div className="skeleton skeleton-text w-24 h-3 mx-auto" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <div className="card">
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-24 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="skeleton h-80 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <Zap className="w-12 h-12 text-steel-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-steel-300 mb-2">Command Center Unavailable</h2>
        <p className="text-steel-500">Unable to load operational data. Check plant connectivity.</p>
        <button onClick={loadData} className="btn-primary mt-6 text-sm">Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="page-header-icon">
              <Zap className="w-4 h-4 text-accent-light" />
            </div>
            <h1 className="page-title">Plant Operations Command Center</h1>
          </div>
          <p className="page-subtitle ml-12">Real-time operational intelligence — Tata Steel Plant A</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="btn-secondary text-xs flex items-center gap-1.5" aria-label="Refresh command center data">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <div className="status-pill status-pill-live">
            <span className="w-1.5 h-1.5 rounded-full bg-risk-low animate-pulse" />
            Live
          </div>
          {lastUpdated && <span className="text-[9px] text-steel-500 font-mono">Updated {lastUpdated}</span>}
        </div>
      </div>

      {/* Section: Live KPIs */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-panel-border" />
        <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">Live Operational KPIs</span>
        <div className="h-px flex-1 bg-panel-border" />
      </div>

      {/* Top KPI Row — 8 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <LiveStatusCard label="Plant Health" value={`${data.plant_health}%`} icon={Gauge} color="rgb(34,197,94)"
          sub={`${data.zone_health.length} zones`} />
        <LiveStatusCard label="Critical Assets" value={data.critical_assets.length} icon={ShieldAlert} color="rgb(239,68,68)"
          sub="requires attention" />
        <LiveStatusCard label="Active Alerts" value={data.active_alerts} icon={AlertTriangle} color="rgb(234,179,8)"
          sub="in queue" />
        <LiveStatusCard label="Predicted Failures" value={data.predicted_failures} icon={TrendingUp} color="rgb(249,115,22)"
          sub="next 30 days" />
        <LiveStatusCard label="Maintenance Due" value={data.maintenance_due} icon={Wrench} color="rgb(59,130,246)"
          sub="this week" />
        <LiveStatusCard label="Inventory Risk" value={data.inventory_risk} icon={Package} color="rgb(168,85,247)"
          sub="low stock items" />
        <LiveStatusCard label="Downtime Risk" value={`${data.downtime_risk}h`} icon={Clock} color="rgb(236,72,153)"
          sub="est. hours" />
        <LiveStatusCard label="Top Risk Assets" value={data.top_risk_assets.length} icon={Cpu} color="rgb(239,68,68)"
          sub="monitoring" />
      </div>

      {/* Section: Detailed Analysis */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-panel-border" />
        <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">Zone Monitoring & Intelligence</span>
        <div className="h-px flex-1 bg-panel-border" />
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-5">
        {/* Left: Zone Heatmap (span 2) */}
        <div className="lg:col-span-2">
          <ZoneHealthHeatmap zones={data.zone_health} />
        </div>

        {/* Center: Plant Health Gauge + KPI Chart (span 2) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card flex justify-center py-6">
            <PlantHealthGauge score={data.plant_health} />
          </div>
          <KpiHistoryChart data={data.kpi_history} />
          <div className="card">
            <h3 className="text-sm font-semibold text-steel-100 mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-accent" />
              AI Status
            </h3>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              {[
                { label: "ML Models Active", value: "9/9", color: "text-risk-low" },
                { label: "Agent Orchestrator", value: "Online", color: "text-risk-low" },
                { label: "Data Pipeline", value: "Streaming", color: "text-risk-low" },
                { label: "LLM Gateway", value: "Connected", color: "text-risk-low" },
              ].map(s => (
                <div key={s.label} className="bg-steel-800/60 rounded-lg p-2.5 border border-panel-border">
                  <p className="text-steel-500 mb-1">{s.label}</p>
                  <p className={`${s.color} font-semibold`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Critical Assets + Insights (span 2) */}
        <div className="lg:col-span-2 space-y-5">
          <CriticalAssetBoard assets={data.top_risk_assets} />
          <ExecutiveInsightsPanel insights={data.insights} compact />
        </div>
      </div>
    </div>
  );
}
