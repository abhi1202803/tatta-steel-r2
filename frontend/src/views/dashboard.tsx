"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Activity, AlertTriangle, DollarSign, Wrench, TrendingUp, CheckCircle,
  Clock, Zap, LayoutDashboard, RefreshCw, ShieldAlert, Cpu, Gauge,
  Maximize2, Download, BarChart2, PieChart, TrendingDown, Brain,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line,
  ScatterChart, Scatter, ZAxis, ComposedChart, ReferenceLine,
} from "recharts";

const ExecutiveInsightsPanel = dynamic(() => import("@/components/insights/ExecutiveInsightsPanel"), {
  loading: () => <div className="card animate-pulse h-64" />,
});
import { api, type DashboardData, type FailureProbability, type RULDistributionItem, type EquipmentHealthRanking, type ZoneHealthItem, type ExecutiveInsightFull } from "@/services/api";
import { toast } from "sonner";
import { useLayout } from "@/context/LayoutContext";
import { SPLASH_KEY } from "@/lib/app-loading";
import { formatCurrency, healthColor, formatHoursToDays, formatPercentage, timeAgo } from "@/utils/formatters";
import {
  KpiRowSkeleton, ChartCardSkeleton, TableSkeleton, PageHeaderSkeleton,
} from "@/components/Skeletons";

// ── Chart color system ──
const RISK_COLORS: Record<string, string> = {
  low: "rgb(34,197,94)", medium: "rgb(234,179,8)", high: "rgb(249,115,22)", critical: "rgb(239,68,68)",
};
const CHART_GRID = "rgb(42,54,78)";
const CHART_TEXT = "rgb(148,163,184)";

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

// ── Custom tooltips ──
const KpiTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-steel-800 border border-panel-border rounded-lg px-3 py-2 text-xs shadow-ibm">
      <p className="text-steel-300">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-mono" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ── Plant Health Gauge ──
function PlantHealthGauge({ score }: { score: number }) {
  const color = healthColor(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="rgb(42,54,78)" strokeWidth="8" />
        <circle cx="65" cy="65" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 65 65)"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x="65" y="60" textAnchor="middle" fill="#f8fafc" fontSize="26" fontWeight="700">{score}%</text>
        <text x="65" y="78" textAnchor="middle" fill="rgb(148,163,184)" fontSize="9" fontWeight="600">HEALTH</text>
      </svg>
    </div>
  );
}

// ── Mini bar for health ranking ──
function MiniHealthBar({ score }: { score: number }) {
  const c = healthColor(score);
  return (
    <div className="h-2 bg-steel-800 rounded-full overflow-hidden flex-1 min-w-[40px]">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, background: c }} />
    </div>
  );
}

// ── Asset Heatmap (grid-based) ──
function AssetHeatmap({ equipment }: { equipment: EquipmentHealthRanking[] }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-steel-100">Asset Criticality Heatmap</h3>
        <span className="text-[10px] text-steel-400">{equipment.length} assets</span>
      </div>
      <div className="grid grid-cols-1 gap-0.5 max-h-[220px] overflow-y-auto">
        {equipment.slice(0, 75).map((eq) => {
          const c = RISK_COLORS[eq.risk_level] || RISK_COLORS.low;
          return (
            <div key={eq.id} className="flex items-center gap-2 text-[10px] py-0.5">
              <span className="font-mono text-steel-400 w-14 shrink-0 truncate" title={eq.id}>{eq.id}</span>
              <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ background: "rgb(24,32,48)" }}>
                <div className="h-full rounded-sm transition-all duration-500" style={{ width: `${eq.health_score}%`, background: c, opacity: 0.85 }} />
              </div>
              <span className="w-8 text-right font-mono text-steel-300 shrink-0">{eq.health_score}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Equipment Type Distribution Pie ──
function EquipmentTypePie({ equipment }: { equipment: EquipmentHealthRanking[] }) {
  const typeCount: Record<string, number> = {};
  equipment.forEach(e => { typeCount[e.type] = (typeCount[e.type] || 0) + 1; });
  const data = Object.entries(typeCount).map(([name, value]) => ({ name, value }));
  const COLORS = ["#3b82f6", "#ea580c", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-steel-100 mb-3">Equipment Type Distribution</h3>
      <ResponsiveContainer width="100%" height={200}>
        <RePieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
          </Pie>
          <Tooltip content={<KpiTooltip />} />
          <Legend wrapperStyle={{ fontSize: "10px", color: CHART_TEXT }} />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── RUL Distribution ──
function RULDistributionChart({ data }: { data: RULDistributionItem[] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-steel-100 mb-4">RUL Distribution</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
          <XAxis dataKey="range" stroke={CHART_TEXT} fontSize={10} tickLine={false} />
          <YAxis stroke={CHART_TEXT} fontSize={10} tickLine={false} />
          <Tooltip content={<KpiTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Failure Probability Bars ──
function FailureProbabilityChart({ data }: { data: FailureProbability[] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-steel-100 mb-4">Failure Prediction Trend (30-Day)</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data.slice(0, 12)} layout="vertical" margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
          <XAxis type="number" domain={[0, 100]} stroke={CHART_TEXT} fontSize={9} tickLine={false} tickFormatter={v => `${v}%`} />
          <YAxis type="category" dataKey="equipment_id" stroke={CHART_TEXT} fontSize={9} tickLine={false} width={50} />
          <Tooltip content={<KpiTooltip />} formatter={(v: number) => `${v}%`} />
          <Bar dataKey="probability_30d" radius={[0, 4, 4, 0]} maxBarSize={16}>
            {data.slice(0, 12).map((d) => (
              <Cell key={d.equipment_id} fill={RISK_COLORS[d.risk_level] || RISK_COLORS.low} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Zone Health ──
function ZoneHealthView({ data }: { data: ZoneHealthItem[] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-steel-100 mb-4">Plant Zone Health</h3>
      <div className="space-y-3">
        {data.map(z => {
          const c = z.avg_health >= 80 ? "rgb(34,197,94)" : z.avg_health >= 60 ? "rgb(234,179,8)" : z.avg_health >= 40 ? "rgb(249,115,22)" : "rgb(239,68,68)";
          return (
            <div key={z.zone}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-steel-200">{z.zone}</span>
                <span className="font-mono text-steel-400">{z.avg_health}% · {z.equipment_count} assets{ z.critical_count > 0 ? ` · ${z.critical_count} critical` : ""}</span>
              </div>
              <div className="h-2.5 bg-steel-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${z.avg_health}%`, background: c }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Equipment Health Ranking Table ──
function EquipmentHealthRankingTable({ data }: { data: EquipmentHealthRanking[] }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-panel-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-steel-100">Equipment Health Ranking</h3>
        <span className="text-[10px] text-steel-400">Top {Math.min(10, data.length)} critical</span>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-8">#</th>
              <th>Asset</th>
              <th>Type</th>
              <th>Health</th>
              <th>Risk</th>
              <th>RUL</th>
              <th>Anomaly</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((eq, i) => (
              <tr key={eq.id} className="hover:bg-panel-hover/40 transition-colors">
                <td className="text-steel-500 text-xs">{i + 1}</td>
                <td>
                  <span className="font-mono font-semibold text-accent-light text-xs">{eq.id}</span>
                  <span className="text-steel-400 text-[10px] ml-2">{eq.name}</span>
                </td>
                <td className="text-steel-400 text-xs">{eq.type}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <MiniHealthBar score={eq.health_score} />
                    <span className="text-[10px] font-mono w-8 text-right" style={{ color: healthColor(eq.health_score) }}>{eq.health_score}%</span>
                  </div>
                </td>
                <td>
                  <span className={`badge text-[9px] capitalize ${eq.risk_level === "critical" ? "badge-critical" : eq.risk_level === "high" ? "badge-high" : eq.risk_level === "medium" ? "badge-medium" : "badge-low"}`}>{eq.risk_level}</span>
                </td>
                <td className="font-mono text-xs" style={{ color: eq.rul_days < 15 ? "rgb(239,68,68)" : eq.rul_days < 30 ? "rgb(234,179,8)" : "rgb(34,197,94)" }}>{eq.rul_days}d</td>
                <td className="font-mono text-xs text-steel-300">{(eq.anomaly_score * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN DASHBOARD PAGE
// ═══════════════════════════════════════════════
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [failureProbs, setFailureProbs] = useState<FailureProbability[]>([]);
  const [rulDist, setRulDist] = useState<RULDistributionItem[]>([]);
  const [healthRanking, setHealthRanking] = useState<EquipmentHealthRanking[]>([]);
  const [zoneHealth, setZoneHealth] = useState<ZoneHealthItem[]>([]);
  const [insights, setInsights] = useState<ExecutiveInsightFull[]>([]);
  const [plantHealthScore, setPlantHealthScore] = useState(0);
  const [mtbfHours, setMTBFHours] = useState(0);
  const [availPct, setAvailPct] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [live, setLive] = useState(false);
  const { setSplashConfig, triggerSplash } = useLayout();
  const loadingRef = useRef(true);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      const d = await api.getDashboard();
      setData(d);
      setLive(true);

      const plantHealth = d.total_equipment > 0 ? Math.round((d.healthy_count / d.total_equipment) * 100) : 0;
      setPlantHealthScore(plantHealth);

      const [probs, rDist, hRank, zHealth, ins, mtbf] = await Promise.all([
        api.getFailureProbabilities(),
        api.getRULDistribution(),
        api.getEquipmentHealthRanking(),
        api.getZoneHealth(),
        api.getExecutiveInsightsFull(),
        api.getMTBFMetrics(),
      ]);
      setFailureProbs(probs);
      setRulDist(rDist);
      setHealthRanking(hRank);
      setZoneHealth(zHealth);
      setInsights(ins);
      setMTBFHours(mtbf.mtbf_hours);
      setAvailPct(mtbf.availability_pct);
      setLastUpdated(new Date().toLocaleTimeString());
      toast.success("Dashboard refreshed", { description: "All data updated successfully" });
    } catch {
      setLive(false);
      toast.error("Refresh failed", { description: "Unable to reach backend" });
    }
  };

  const handleRefreshClick = () => {
    triggerSplash();
    setLoading(true);
    loadAll().finally(() => {
      loadingRef.current = false;
      setLoading(false);
    });
  };

  useEffect(() => {
    setSplashConfig({ 
      minDuration: 2000,
    });
    setLoading(true);
    loadAll().finally(() => {
      loadingRef.current = false;
      setLoading(false);
    });
  }, []);

  // Show page-level skeleton while data is loading (Sidebar + Topbar remain visible)
  if (loading && !data) {
    return (
      <div className="dashboard-enter">
        <PageHeaderSkeleton />
        <KpiRowSkeleton count={4} />
        <KpiRowSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <ChartCardSkeleton height="lg" />
          <ChartCardSkeleton height="lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <ChartCardSkeleton height="lg" />
          <ChartCardSkeleton height="lg" />
        </div>
        <ChartCardSkeleton height="xl" />
        <div className="mt-6">
          <TableSkeleton rows={5} cols={5} />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const predictedFailures = data.critical_count > 0 ? Math.round(data.critical_count * 1.5) : data.maintenance_scheduled || 0;
  const maintenanceDue = Math.max(1, Math.round(data.critical_count * 1.2));
  const downtimeRisk = data.critical_count * 8 + (data.warning_count || 0) * 3;

  return (
    <div className="dashboard-enter">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="page-header-icon">
              <LayoutDashboard className="w-4 h-4 text-accent-light" />
            </div>
            <h1 className="page-title">Executive Dashboard</h1>
          </div>
          <p className="page-subtitle ml-12">Real-time plant health — Tata Steel Plant A · Industrial Agentic Maintenance AI</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleRefreshClick} className="btn-secondary text-xs flex items-center gap-1.5" aria-label="Refresh dashboard data">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <div className={`status-pill ${live ? "status-pill-live" : "status-pill-demo"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${live ? "bg-risk-low animate-pulse" : "bg-steel-500"}`} />
            {live ? "Live" : "Syncing"}
          </div>
          {lastUpdated && <span className="text-[9px] text-steel-500 font-mono">Updated {lastUpdated}</span>}
        </div>
      </div>

      {/* KPI Row 1 - 6 cards */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
        {/* Plant Health */}
        <motion.div variants={staggerItem} className="card-hover text-center py-4">
          <div className="mb-2 flex justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-risk-low/10 border border-risk-low/20">
              <CheckCircle className="w-5 h-5 text-risk-low" />
            </div>
          </div>
          <PlantHealthGauge score={plantHealthScore} />
          <p className="text-[10px] text-steel-400 mt-0.5 uppercase tracking-wider font-medium">Plant Health</p>
        </motion.div>
        {/* Critical Assets */}
        <motion.div variants={staggerItem} className="card-hover text-center py-5">
          <div className="w-9 h-9 rounded-xl mx-auto mb-3 flex items-center justify-center bg-risk-critical/10 border border-risk-critical/20">
            <AlertTriangle className="w-4 h-4 text-risk-critical" />
          </div>
          <p className="kpi-value text-2xl text-risk-critical">{data.critical_count}</p>
          <p className="text-[10px] text-steel-400 mt-1.5 uppercase tracking-wider font-medium">Critical Assets</p>
          <p className="text-[9px] mt-1 font-semibold text-risk-critical/70">{data.warning_count} warning</p>
        </motion.div>
        {/* Active Alerts */}
        <motion.div variants={staggerItem} className="card-hover text-center py-5">
          <div className="w-9 h-9 rounded-xl mx-auto mb-3 flex items-center justify-center bg-risk-medium/10 border border-risk-medium/20">
            <Activity className="w-4 h-4 text-risk-medium" />
          </div>
          <p className="kpi-value text-2xl text-risk-medium">{data.active_alerts}</p>
          <p className="text-[10px] text-steel-400 mt-1.5 uppercase tracking-wider font-medium">Active Alerts</p>
          <p className="text-[9px] mt-1 font-semibold text-risk-medium/70">{data.critical_count} critical</p>
        </motion.div>
        {/* Predicted Failures */}
        <motion.div variants={staggerItem} className="card-hover text-center py-5">
          <div className="w-9 h-9 rounded-xl mx-auto mb-3 flex items-center justify-center bg-risk-high/10 border border-risk-high/20">
            <TrendingUp className="w-4 h-4 text-risk-high" />
          </div>
          <p className="kpi-value text-2xl text-risk-high">{predictedFailures}</p>
          <p className="text-[10px] text-steel-400 mt-1.5 uppercase tracking-wider font-medium">Predicted Failures</p>
          <p className="text-[9px] mt-1 font-semibold text-risk-high/70">next 30 days</p>
        </motion.div>
        {/* Maintenance Due */}
        <motion.div variants={staggerItem} className="card-hover text-center py-5">
          <div className="w-9 h-9 rounded-xl mx-auto mb-3 flex items-center justify-center bg-accent/10 border border-accent/20">
            <Wrench className="w-4 h-4 text-accent" />
          </div>
          <p className="kpi-value text-2xl text-accent">{maintenanceDue}</p>
          <p className="text-[10px] text-steel-400 mt-1.5 uppercase tracking-wider font-medium">Maint. Due</p>
          <p className="text-[9px] mt-1 font-semibold text-accent/70">this week</p>
        </motion.div>
        {/* Downtime Risk */}
        <motion.div variants={staggerItem} className="card-hover text-center py-5">
          <div className="w-9 h-9 rounded-xl mx-auto mb-3 flex items-center justify-center bg-steel-accent/10 border border-steel-accent/20">
            <Clock className="w-4 h-4 text-steel-accent" />
          </div>
          <p className="kpi-value text-2xl text-steel-accent-light">{downtimeRisk}h</p>
          <p className="text-[10px] text-steel-400 mt-1.5 uppercase tracking-wider font-medium">Downtime Risk</p>
          <p className="text-[9px] mt-1 font-semibold text-steel-accent/70">est. hours</p>
        </motion.div>
      </motion.div>

      {/* KPI Row 2 - 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 stagger">
        <div className="card-hover flex items-center gap-4 animate-fade-in-up">
          <div className="p-2.5 rounded-xl shrink-0 bg-risk-low/10 border border-risk-low/20">
            <Gauge className="w-5 h-5 text-risk-low" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-steel-400">MTBF</p>
            <p className="text-xl font-semibold text-steel-50">{formatHoursToDays(mtbfHours)}</p>
            <p className="text-[10px] text-steel-500">{availPct}% availability</p>
          </div>
        </div>
        <div className="card-hover flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <div className="p-2.5 rounded-xl shrink-0 bg-risk-low/10 border border-risk-low/20">
            <DollarSign className="w-5 h-5 text-risk-low" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-steel-400">Cost Savings MTD</p>
            <p className="text-xl font-semibold text-steel-50">{formatCurrency(data.cost_savings_mtd)}</p>
            <p className="text-[10px] text-steel-500">downtime avoidance</p>
          </div>
        </div>
        <div className="card-hover flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <div className="p-2.5 rounded-xl shrink-0 bg-accent/10 border border-accent/20">
            <TrendingDown className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-steel-400">Avg RUL</p>
            <p className="text-xl font-semibold text-steel-50">{data.avg_rul_days}d</p>
            <p className="text-[10px] text-steel-500">across fleet</p>
          </div>
        </div>
        <div className="card-hover flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <div className="p-2.5 rounded-xl shrink-0 bg-risk-low/10 border border-risk-low/20">
            <Cpu className="w-5 h-5 text-risk-low" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-steel-400">Total Equipment</p>
            <p className="text-xl font-semibold text-steel-50">{data.total_equipment}</p>
            <p className="text-[10px] text-steel-500">{data.healthy_count} healthy</p>
          </div>
        </div>
      </div>

      {/* Section: Analytics */}
      <div className="flex items-center gap-3 mb-4 mt-2">
        <div className="h-px flex-1 bg-panel-border" />
        <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">Analytics & Distribution</span>
        <div className="h-px flex-1 bg-panel-border" />
      </div>

      {/* Row: Asset Heatmap + Equipment Type Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 stagger">
        <EquipmentTypePie equipment={healthRanking} />
        <RULDistributionChart data={rulDist} />
      </div>

      {/* Row: RUL Distribution + Zone Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 stagger">
        <AssetHeatmap equipment={healthRanking} />
        <ZoneHealthView data={zoneHealth} />
      </div>

      {/* Section: Predictions & Insights */}
      <div className="flex items-center gap-3 mb-4 mt-2">
        <div className="h-px flex-1 bg-panel-border" />
        <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">Predictions & AI Insights</span>
        <div className="h-px flex-1 bg-panel-border" />
      </div>

      {/* Row: Failure Probabilities + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5 stagger">
        <div className="lg:col-span-2">
          <FailureProbabilityChart data={failureProbs} />
        </div>
      <ExecutiveInsightsPanel insights={insights} loading={false} />
      </div>

      {/* Section: Equipment Rankings */}
      <div className="flex items-center gap-3 mb-4 mt-2">
        <div className="h-px flex-1 bg-panel-border" />
        <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">Equipment Rankings</span>
        <div className="h-px flex-1 bg-panel-border" />
      </div>

      {/* Equipment Health Ranking Table */}
      <div className="stagger">
        <EquipmentHealthRankingTable data={healthRanking} />
      </div>
    </div>
  );
}
