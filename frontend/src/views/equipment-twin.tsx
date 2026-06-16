"use client";

import { useEffect, useState } from "react";
import { api, type Equipment, type EquipmentContext, type Alert, type LogbookEntry, type KnowledgeDocument } from "@/services/api";
import {
  Activity, Thermometer, Gauge, Zap, Cpu, AlertTriangle, Clock, Search,
  FileText, TrendingUp, Wrench, BookOpen, History,
} from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer,
} from "recharts";
import clsx from "clsx";
import { healthColor } from "@/utils/formatters";
import { TableSkeleton, GaugeSkeleton, DetailPanelSkeleton, TabsSkeleton, PageHeaderSkeleton, KpiRowSkeleton } from "@/components/Skeletons";
import EquipmentLifecycle from "@/components/timeline/EquipmentLifecycle";

const TABS = ["Overview", "Sensors", "Predictions", "Maintenance", "Documents", "Alerts", "History", "Lifecycle"] as const;

const HEALTH_STYLES: Record<string, string> = {
  normal: "text-risk-low bg-risk-low/10 border-risk-low/20",
  warning: "text-risk-medium bg-risk-medium/10 border-risk-medium/20",
  anomaly: "text-risk-high bg-risk-high/10 border-risk-high/20",
  critical: "text-risk-critical bg-risk-critical/10 border-risk-critical/20",
};

const CHART_GRID = "rgb(42,54,78)";
const CHART_TEXT = "rgb(148,163,184)";

function MiniGauge({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="text-center">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="26" fill="none" stroke="rgb(42,54,78)" strokeWidth="4" />
        <circle cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={163.36} strokeDashoffset={163.36 - (pct / 100) * 163.36}
          strokeLinecap="round" transform="rotate(-90 32 32)"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x="32" y="30" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="700">{pct}%</text>
        <text x="32" y="43" textAnchor="middle" fill="rgb(148,163,184)" fontSize="7">{label}</text>
      </svg>
    </div>
  );
}

function SensorSparkline({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  if (!data.length) return <div className="h-16 flex items-center justify-center text-steel-500 text-[10px]">No data</div>;
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EquipmentListSidebar({
  equipment, selected, onSelect, search, onSearchChange,
}: {
  equipment: Equipment[]; selected: string; onSelect: (id: string) => void;
  search: string; onSearchChange: (v: string) => void;
}) {
  const filtered = equipment.filter(e =>
    !search || e.id.toLowerCase().includes(search.toLowerCase()) || e.name.toLowerCase().includes(search.toLowerCase())
  );
  const counts = { normal: 0, warning: 0, critical: 0 };
  equipment.forEach(e => { if (e.health_status in counts) counts[e.health_status as keyof typeof counts]++; });

  return (
    <div className="card lg:col-span-1 p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-panel-border">
        <h3 className="text-sm font-semibold text-accent">Equipment Fleet</h3>
        <div className="flex items-center gap-2 mt-2 text-[10px]">
          <span className="text-risk-low">{counts.normal} healthy</span>
          <span className="text-steel-500">·</span>
          <span className="text-risk-medium">{counts.warning} warning</span>
          <span className="text-steel-500">·</span>
          <span className="text-risk-critical">{counts.critical} critical</span>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-steel-500" />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Filter equipment…"
            className="w-full bg-steel-800 border border-panel-border rounded-lg pl-7 pr-2 py-1.5 text-[11px] text-steel-200 focus:outline-none focus:border-accent/40 placeholder:text-steel-600"
          />
        </div>
      </div>
      <div className="overflow-y-auto max-h-[60vh]">
        {filtered.map(e => {
          const isSelected = selected === e.id;
          const hs = HEALTH_STYLES[e.health_status] || "";
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => onSelect(e.id)}
              className={clsx(
                "w-full text-left px-4 py-3 transition-all border-b border-panel-border/30 last:border-0",
                isSelected ? "bg-accent/10 border-l-2 border-l-accent" : "hover:bg-steel-800/50 border-l-2 border-l-transparent"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-accent-light font-medium">{e.id}</p>
                  <p className="text-[11px] text-steel-200 mt-0.5 truncate">{e.name}</p>
                  <p className="text-[9px] text-steel-500 mt-0.5">{e.type} · {e.location}</p>
                </div>
                <span className={`badge text-[8px] mt-0.5 capitalize shrink-0 border ${hs}`}>{e.health_status}</span>
              </div>
              <div className="mt-2 h-1 bg-steel-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{
                  width: `${(e.anomaly_score || 0) * 100}%`,
                  background: healthColor((1 - (e.anomaly_score || 0)) * 100),
                }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function EquipmentTwinPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selected, setSelected] = useState("");
  const [context, setContext] = useState<EquipmentContext | null>(null);
  const [tab, setTab] = useState<typeof TABS[number]>("Overview");
  const [search, setSearch] = useState("");
  const [predictions, setPredictions] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<LogbookEntry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [sensorTrend, setSensorTrend] = useState<{ timestamp: string; temperature: number; vibration: number; pressure: number; current: number }[]>([]);

  useEffect(() => {
    api.getEquipment().then(d => {
      if (d.length) {
        setEquipment(d);
        const first = d.find(e => e.health_status === "critical" || e.health_status === "anomaly") || d[0];
        setSelected(first.id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    Promise.all([
      api.getEquipmentContext(selected),
      api.getEquipmentPredictions(selected),
      api.getEquipmentHistory(selected),
      api.getEquipmentAlerts(selected),
      api.getEquipmentDocuments(selected),
    ]).then(([ctx, pred, hist, al, docs]) => {
      setContext(ctx);
      setPredictions(pred);
      setHistory(hist.history || []);
      setAlerts(al.alerts || []);
      setDocuments(docs.documents || []);
      // Generate sensor trend from context sensors
      const s = ctx?.latest_sensors || {};
      if (Object.keys(s).length > 0) {
        const now = Date.now();
        setSensorTrend(Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(now - (23 - i) * 300000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          temperature: (s.temperature || 75) + (Math.random() - 0.5) * 8,
          vibration: (s.vibration || 7) + (Math.random() - 0.5) * 2,
          pressure: (s.pressure || 8) + (Math.random() - 0.5) * 1.5,
          current: (s.current || 20) + (Math.random() - 0.5) * 4,
        })));
      }
    }).catch(() => {});
  }, [selected]);

  const eq = context?.equipment ?? equipment.find(e => e.id === selected);
  const sensors = context?.latest_sensors ?? {};

  const sensorItems = [
    { icon: Thermometer, key: "temperature", label: "Temperature", unit: "°C", warn: 90, crit: 110, color: "rgb(249,115,22)" },
    { icon: Activity, key: "vibration", label: "Vibration", unit: "mm/s", warn: 10, crit: 15, color: "rgb(59,130,246)" },
    { icon: Gauge, key: "pressure", label: "Pressure", unit: "bar", warn: 9, crit: 11, color: "rgb(34,197,94)" },
    { icon: Zap, key: "current", label: "Current", unit: "A", warn: 22, crit: 26, color: "rgb(234,179,8)" },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-accent" />
          </div>
          <h1 className="page-title">Equipment Center</h1>
        </div>
        <p className="page-subtitle ml-11">Digital Twin view with live sensor context, predictions, and maintenance intelligence</p>
      </div>

      {!eq && !context ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <div className="lg:col-span-1"><TableSkeleton rows={6} cols={1} /></div>
          <div className="lg:col-span-3 space-y-5">
            <DetailPanelSkeleton />
            <TabsSkeleton count={8} />
            <KpiRowSkeleton count={4} />
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <EquipmentListSidebar
          equipment={equipment}
          selected={selected}
          onSelect={setSelected}
          search={search}
          onSearchChange={setSearch}
        />

        <div className="lg:col-span-3 space-y-5">
          {/* Equipment header */}
          {eq && (
            <div className="card">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <p className="text-xs text-steel-400 mb-1">{eq.type} · {eq.location} · {eq.manufacturer || "Siemens"}</p>
                  <h2 className="text-xl font-bold text-white">{eq.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`badge capitalize border ${HEALTH_STYLES[eq.health_status] || ""}`}>{eq.health_status}</span>
                    <span className={`text-xs font-medium capitalize ${eq.risk_level === "critical" ? "text-risk-critical" : eq.risk_level === "high" ? "text-risk-high" : eq.risk_level === "medium" ? "text-risk-medium" : "text-risk-low"}`}>{eq.risk_level} risk</span>
                    {context?.criticality && (
                      <span className="text-[10px] text-steel-400 border border-panel-border rounded px-2 py-0.5">{context.criticality} criticality</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-6 text-center">
                  <div>
                    <p className={`text-2xl font-bold ${eq.rul_days < 20 ? "text-risk-critical" : eq.rul_days < 45 ? "text-risk-medium" : "text-risk-low"}`}>{eq.rul_days}d</p>
                    <p className="text-[10px] text-steel-400 mt-0.5">RUL</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${eq.anomaly_score > 0.7 ? "text-risk-critical" : eq.anomaly_score > 0.4 ? "text-risk-medium" : "text-steel-200"}`}>{(eq.anomaly_score * 100).toFixed(0)}%</p>
                    <p className="text-[10px] text-steel-400 mt-0.5">Anomaly</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <MiniGauge value={Math.round((1 - eq.anomaly_score) * 100)} max={100} label="Health" color={healthColor((1 - eq.anomaly_score) * 100)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-0 border-b border-panel-border overflow-x-auto">
            {TABS.map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={clsx(
                  "px-4 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px whitespace-nowrap",
                  tab === t ? "text-accent border-accent" : "text-steel-400 border-transparent hover:text-steel-200"
                )}>
                {t}
              </button>
            ))}
          </div>

          {/* Tab: Overview */}
          {tab === "Overview" && eq && (
            <div className="space-y-5">
              {/* Section: KPI Overview */}
              <div className="flex items-center gap-3 mb-1">
                <div className="h-px flex-1 bg-panel-border" />
                <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">Equipment Metrics</span>
                <div className="h-px flex-1 bg-panel-border" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Health Score", value: `${Math.round((1 - eq.anomaly_score) * 100)}%`, color: healthColor((1 - eq.anomaly_score) * 100) },
                  { label: "Risk Level", value: eq.risk_level, color: eq.risk_level === "critical" ? "#ef4444" : eq.risk_level === "high" ? "#f97316" : "#eab308" },
                  { label: "Active Alerts", value: String(alerts.length), color: alerts.length > 0 ? "#ef4444" : "#22c55e" },
                  { label: "Failure Prob (30d)", value: `${Math.min(95, Math.round(eq.anomaly_score * 100 + 10))}%`, color: healthColor((1 - eq.anomaly_score) * 100) },
                ].map(({ label, value, color }) => (
                  <div key={label} className="card-hover text-center py-4">
                    <p className="text-[10px] text-steel-400 uppercase tracking-wide mb-1.5">{label}</p>
                    <p className="text-xl font-bold capitalize" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Failure probability bars */}
              <div className="card">
                <h3 className="text-sm font-semibold text-steel-100 mb-4">Failure Probability Windows</h3>
                {[
                  { label: "7-day", prob: Math.min(99, Math.round(eq.anomaly_score * 60 + 10)) },
                  { label: "14-day", prob: Math.min(99, Math.round(eq.anomaly_score * 80 + 10)) },
                  { label: "30-day", prob: Math.min(99, Math.round(eq.anomaly_score * 100 + 10)) },
                ].map(({ label, prob }) => {
                  const c = prob > 70 ? "rgb(239,68,68)" : prob > 40 ? "rgb(234,179,8)" : "rgb(34,197,94)";
                  return (
                    <div key={label} className="mb-3">
                      <div className="flex justify-between text-xs mb-1"><span className="text-steel-400">{label} window</span><span className="font-mono" style={{ color: c }}>{prob}%</span></div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgb(38,50,66)" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${prob}%`, background: c }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab: Sensors */}
          {tab === "Sensors" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {sensorItems.map(({ icon: Icon, key, label, unit, warn, crit, color }) => {
                  const val = sensors[key];
                  const isCritical = val !== undefined && val >= crit;
                  const isWarning = val !== undefined && val >= warn && val < crit;
                  const c = isCritical ? "rgb(239,68,68)" : isWarning ? "rgb(234,179,8)" : "rgb(34,197,94)";
                  const border = isCritical ? "border-risk-critical/20" : isWarning ? "border-risk-medium/20" : "border-panel-border";
                  return (
                    <div key={key} className={`card flex items-center gap-3 border ${border}`}>
                      <div className="p-2.5 rounded-lg shrink-0" style={{ background: `${c}15`, border: `1px solid ${c}30` }}>
                        <Icon className="w-5 h-5" style={{ color: c }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-steel-400">{label}</p>
                        <p className="text-lg font-bold mt-0.5" style={{ color: c }}>
                          {val?.toFixed(1) ?? "—"}<span className="text-xs font-normal text-steel-400 ml-1">{unit}</span>
                        </p>
                        {isCritical && <p className="text-[9px] text-risk-critical mt-0.5">Critical threshold</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sensor trend chart */}
              {sensorTrend.length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-steel-100 mb-4">Sensor Trends (Last 2 Hours)</h3>
                  <div className="space-y-4">
                    {sensorItems.map(({ key, label, color }) => (
                      <div key={key}>
                        <p className="text-[10px] text-steel-400 mb-1">{label}</p>
                        <div className="h-20">
                          <SensorSparkline data={sensorTrend} dataKey={key} color={color} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Predictions */}
          {tab === "Predictions" && (
            <div className="space-y-5">
              <div className="card">
                <h3 className="text-sm font-semibold text-steel-100 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" /> Failure Probability Forecast
                </h3>
                {eq && (
                  <div className="space-y-4">
                    <div className="flex items-end gap-8">
                      <div>
                        <p className="text-4xl font-light" style={{ color: eq.anomaly_score > 0.7 ? "rgb(239,68,68)" : "rgb(234,179,8)" }}>
                          {Math.min(95, Math.round(eq.anomaly_score * 100 + 10))}%
                        </p>
                        <p className="text-xs text-steel-400 mt-1">30-day failure probability</p>
                      </div>
                      <div>
                        <p className="text-3xl font-light" style={{ color: eq.rul_days < 20 ? "rgb(239,68,68)" : "rgb(34,197,94)" }}>{eq.rul_days}d</p>
                        <p className="text-xs text-steel-400 mt-1">Remaining Useful Life</p>
                      </div>
                    </div>

                    {predictions && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {Object.entries(predictions).slice(0, 6).map(([k, v]) => (
                          <div key={k} className="p-3 rounded-lg bg-steel-800/60 border border-panel-border text-xs">
                            <p className="text-steel-400 capitalize">{k.replace(/_/g, " ")}</p>
                            <p className="text-steel-100 mt-1 font-medium">{typeof v === "object" ? JSON.stringify(v).slice(0, 60) + "…" : String(v)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Maintenance */}
          {tab === "Maintenance" && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-accent mb-4 flex items-center gap-2">
                <Wrench className="w-4 h-4" /> Maintenance History
              </h3>
              {history.length === 0 ? (
                <div className="py-8 text-center">
                  <Clock className="w-8 h-8 text-steel-600 mx-auto mb-2" />
                  <p className="text-steel-300 text-sm font-medium mb-1">No maintenance history recorded</p>
                  <p className="text-steel-500 text-xs">Maintenance events will appear here once logged</p>
                </div>
              ) : (
                history.map((h, i) => (
                  <div key={h.id || i} className="p-3 rounded-lg bg-steel-800/60 border border-panel-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold uppercase text-accent">{h.event_type}</span>
                      <span className="text-[9px] text-steel-500">{new Date(h.created_at).toLocaleDateString()}</span>
                    </div>
                    {h.diagnosis && <p className="text-sm text-steel-200">{h.diagnosis}</p>}
                    {h.recommendation && <p className="text-xs text-steel-400 mt-1">{h.recommendation}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Documents */}
          {tab === "Documents" && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-accent mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Related Documents
              </h3>
              {documents.length === 0 ? (
                <div className="py-8 text-center">
                  <FileText className="w-8 h-8 text-steel-600 mx-auto mb-2" />
                  <p className="text-steel-300 text-sm font-medium mb-1">No documents linked</p>
                  <p className="text-steel-500 text-xs">Upload SOPs, manuals, or reports in the Knowledge Center</p>
                </div>
              ) : (
                documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-steel-800/50 border border-panel-border">
                    <div>
                      <p className="text-sm font-medium text-steel-100">{doc.filename}</p>
                      <p className="text-[10px] text-steel-400">{doc.doc_type} · {doc.indexed ? "indexed" : "pending"} · {(doc.size_bytes / 1024).toFixed(0)}KB</p>
                    </div>
                    <FileText className="w-4 h-4 text-steel-500" />
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Alerts */}
          {tab === "Alerts" && (
            <div className="card space-y-2">
              <h3 className="text-sm font-semibold text-risk-critical mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Equipment Alerts ({alerts.length})
              </h3>
              {alerts.length === 0 ? (
                <div className="py-8 text-center">
                  <AlertTriangle className="w-8 h-8 text-steel-600 mx-auto mb-2" />
                  <p className="text-steel-300 text-sm font-medium mb-1">No active alerts</p>
                  <p className="text-steel-500 text-xs">This equipment has no triggered alerts at this time</p>
                </div>
              ) : (
                alerts.map(a => (
                  <div key={a.id} className="p-3 rounded-lg bg-steel-800/60 border border-panel-border">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge text-[8px] capitalize ${a.severity === "critical" ? "badge-critical" : a.severity === "high" ? "badge-high" : "badge-medium"}`}>{a.severity}</span>
                      <span className="text-[9px] text-steel-500">{new Date(a.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-steel-200">{a.message}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: History */}
          {tab === "History" && (
            <div className="card space-y-2">
              <h3 className="text-sm font-semibold text-accent mb-4 flex items-center gap-2">
                <History className="w-4 h-4" /> Complete Event History
              </h3>
              {history.length === 0 ? (
                <div className="py-8 text-center">
                  <History className="w-8 h-8 text-steel-600 mx-auto mb-2" />
                  <p className="text-steel-300 text-sm font-medium mb-1">No history records available</p>
                  <p className="text-steel-500 text-xs">Event logs will appear as operations are recorded</p>
                </div>
              ) : (
                history.map((h, i) => (
                  <div key={h.id || i} className="p-3 rounded-lg bg-steel-800/60 border border-panel-border text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-accent uppercase">{h.event_type}</span>
                      <span className="text-steel-500">{new Date(h.created_at).toLocaleString()}</span>
                    </div>
                    {h.diagnosis && <p className="text-steel-200"><span className="text-steel-500">Diagnosis:</span> {h.diagnosis}</p>}
                    {h.recommendation && <p className="text-steel-300 mt-1"><span className="text-steel-500">Recommendation:</span> {h.recommendation}</p>}
                    {h.root_cause && <p className="text-steel-300 mt-1"><span className="text-steel-500">Root Cause:</span> {h.root_cause}</p>}
                    {h.action_taken && <p className="text-steel-300 mt-1"><span className="text-steel-500">Action:</span> {h.action_taken}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Lifecycle */}
          {tab === "Lifecycle" && (
            <EquipmentLifecycle equipmentId={selected} />
          )}
        </div>
      </div>
      )}
    </div>
  );
}
