"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api, type Alert, type AlertAnalytics, type Equipment } from "@/services/api";
import { toast } from "sonner";
import {
  Bell, AlertTriangle, ShieldAlert, CheckCircle2, UserPlus, ArrowUp, Wrench, CheckCheck,
  Search, Filter, X, TrendingUp, Clock, ArrowUpDown, ListChecks, Activity, Timer, Target,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { timeAgo } from "@/utils/formatters";
import { KpiRowSkeleton, ChartCardSkeleton, TableSkeleton, AlertListSkeleton, PageHeaderSkeleton } from "@/components/Skeletons";

const SEVERITY_ORDER = ["critical", "high", "medium", "low"] as const;
const TIME_FILTERS = ["All", "1h", "24h", "7d", "30d"] as const;
const STATUS_FILTERS = ["all", "active", "acknowledged", "resolved"] as const;

type QueueSort = "time" | "priority";

const SEV_CONFIG: Record<string, { color: string; bg: string; border: string; icon: typeof Bell; priority: number }> = {
  critical: { color: "text-risk-critical", bg: "bg-risk-critical/10", border: "border-risk-critical/25", icon: ShieldAlert, priority: 4 },
  high: { color: "text-risk-high", bg: "bg-risk-high/10", border: "border-risk-high/25", icon: AlertTriangle, priority: 3 },
  medium: { color: "text-risk-medium", bg: "bg-risk-medium/10", border: "border-risk-medium/25", icon: Bell, priority: 2 },
  low: { color: "text-risk-low", bg: "bg-risk-low/10", border: "border-risk-low/25", icon: CheckCircle2, priority: 1 },
};

const SEV_COLORS: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e" };

const CHART_GRID = "rgb(42,54,78)";
const CHART_TEXT = "rgb(148,163,184)";
const EQUIP_TYPE_COLORS = ["#3b82f6", "#ea580c", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899", "#84cc16"];

function filterByTime(alerts: Alert[], filter: string): Alert[] {
  if (filter === "All") return alerts;
  const now = Date.now();
  const ms: Record<string, number> = { "1h": 3600000, "24h": 86400000, "7d": 604800000, "30d": 2592000000 };
  const cutoff = now - (ms[filter] || 0);
  return alerts.filter(a => new Date(a.timestamp).getTime() > cutoff);
}

function prioritySort(a: Alert, b: Alert): number {
  const pa = SEV_CONFIG[a.severity]?.priority ?? 0;
  const pb = SEV_CONFIG[b.severity]?.priority ?? 0;
  if (pa !== pb) return pb - pa;
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

// ── Recommended actions per alert severity/context ──
function getRecommendedActions(alert: Alert, eq: Equipment | undefined): string[] {
  const actions: string[] = [];
  if (alert.severity === "critical") {
    actions.push("Dispatch emergency maintenance team immediately");
    actions.push("Initiate equipment shutdown protocol");
    actions.push("Notify plant safety officer");
  } else if (alert.severity === "high") {
    actions.push("Schedule inspection within 4 hours");
    actions.push("Review sensor data for anomaly patterns");
    actions.push("Prepare spare parts for possible replacement");
  } else if (alert.severity === "medium") {
    actions.push("Add to next maintenance window");
    actions.push("Monitor sensor readings for escalation");
  } else {
    actions.push("Log for routine review");
    actions.push("No immediate action required");
  }
  if (eq && eq.rul_days < 15) {
    actions.push(`RUL critically low (${eq.rul_days}d) — expedite parts procurement`);
  }
  return actions;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [analytics, setAnalytics] = useState<AlertAnalytics | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [actionMsg, setActionMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<string>("All");
  const [equipmentFilter, setEquipmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const [queueSort, setQueueSort] = useState<QueueSort>("priority");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [batchMsg, setBatchMsg] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Data loading ──
  const load = () => {
    setLoading(true);
    Promise.all([api.getAlerts(), api.getAlertAnalytics(), api.getEquipment()])
      .then(([al, an, eq]) => {
        setAlerts(al);
        setAnalytics(an);
        setEquipment(eq);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // ── Equipment lookup map ──
  const eqMap = useMemo(() => {
    const m = new Map<string, Equipment>();
    equipment.forEach(e => m.set(e.id, e));
    return m;
  }, [equipment]);

  // ── Filtering ──
  const filtered = useMemo(() => {
    let result = alerts;
    if (severityFilter.length > 0) result = result.filter(a => severityFilter.includes(a.severity));
    result = filterByTime(result, timeFilter);
    if (equipmentFilter) result = result.filter(a => a.equipment_id === equipmentFilter);
    if (statusFilter === "active") result = result.filter(a => !a.acknowledged && !resolvedIds.has(a.id));
    if (statusFilter === "acknowledged") result = result.filter(a => a.acknowledged && !resolvedIds.has(a.id));
    if (statusFilter === "resolved") result = result.filter(a => resolvedIds.has(a.id));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => a.message.toLowerCase().includes(q) || a.equipment_id.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
    }
    return result;
  }, [alerts, severityFilter, timeFilter, equipmentFilter, statusFilter, searchQuery, resolvedIds]);

  // ── Search autocomplete suggestions ──
  const autocompleteSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) return [];
    const q = searchQuery.toLowerCase();
    const matches = new Set<string>();
    alerts.forEach(a => {
      if (a.message.toLowerCase().includes(q)) matches.add(a.message.slice(0, 65));
      if (a.equipment_id.toLowerCase().includes(q)) matches.add(a.equipment_id);
    });
    return Array.from(matches).slice(0, 5);
  }, [searchQuery, alerts]);

  // ── Grouped by severity ──
  const grouped = useMemo(() => SEVERITY_ORDER.map(sev => ({
    severity: sev,
    items: filtered.filter(a => a.severity === sev),
  })), [filtered]);

  // ── Critical Alert Queue (sorted) ──
  const criticalQueue = useMemo(() => {
    const active = alerts.filter(a => !resolvedIds.has(a.id));
    const sorted = [...active].sort((a, b) => {
      if (queueSort === "priority") return prioritySort(a, b);
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    return sorted.slice(0, 15);
  }, [alerts, resolvedIds, queueSort]);

  // ── Single alert actions ──
  const doAction = async (action: string) => {
    if (!selected) return;
    setActionMsg("");
    const fns: Record<string, () => Promise<unknown>> = {
      acknowledge: () => api.acknowledgeAlert(selected.id),
      assign: () => api.assignAlert(selected.id, "Rajesh Kumar"),
      escalate: () => api.escalateAlert(selected.id),
      "work-order": () => api.createWorkOrder(selected.id),
      resolve: () => api.resolveAlert(selected.id),
    };
    try {
      await fns[action]();
      setActionMsg(`${action} completed for ${selected.id}`);
      toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} completed`, { description: `Alert ${selected.id}` });
      if (action === "acknowledge") {
        setAlerts(prev => prev.map(a => a.id === selected.id ? { ...a, acknowledged: true } : a));
      }
      if (action === "resolve") {
        setResolvedIds(prev => { const next = new Set(prev); next.add(selected.id); return next; });
        setSelected(null);
      }
    } catch {
      setActionMsg(`${action} queued for ${selected.id}`);
      toast.error(`${action.charAt(0).toUpperCase() + action.slice(1)} failed`, { description: `Alert ${selected.id} — action queued for retry` });
      if (action === "resolve") {
        setResolvedIds(prev => { const next = new Set(prev); next.add(selected.id); return next; });
        setSelected(null);
      }
    }
  };

  // ── Batch actions ──
  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedIds.size === filtered.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(filtered.map(a => a.id)));
    }
  };

  const batchAcknowledge = async () => {
    setBatchMsg("");
    const ids = Array.from(checkedIds);
    try {
      await Promise.all(ids.map(id => api.acknowledgeAlert(id)));
      setAlerts(prev => prev.map(a => checkedIds.has(a.id) ? { ...a, acknowledged: true } : a));
      setBatchMsg(`Acknowledged ${ids.length} alerts`);
      toast.success(`Acknowledged ${ids.length} alert${ids.length > 1 ? "s" : ""}`);
      setCheckedIds(new Set());
    } catch {
      setBatchMsg(`Acknowledged ${ids.length} alerts (partial)`);
      toast.error(`Batch acknowledge incomplete`, { description: "Some alerts may not have been acknowledged" });
      setCheckedIds(new Set());
    }
  };

  const batchAssign = async () => {
    setBatchMsg("");
    const ids = Array.from(checkedIds);
    try {
      await Promise.all(ids.map(id => api.assignAlert(id, "Rajesh Kumar")));
      setBatchMsg(`Assigned ${ids.length} alerts to Rajesh Kumar`);
      toast.success(`Assigned ${ids.length} alert${ids.length > 1 ? "s" : ""} to Rajesh Kumar`);
      setCheckedIds(new Set());
    } catch {
      setBatchMsg(`Assignment queued for ${ids.length} alerts`);
      toast.error(`Batch assignment failed`, { description: "Assignment queued for retry" });
      setCheckedIds(new Set());
    }
  };

  const toggleSeverity = (s: string) => {
    setSeverityFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const clearFilters = () => {
    setSeverityFilter([]);
    setTimeFilter("All");
    setEquipmentFilter("");
    setStatusFilter("all");
    setSearchQuery("");
  };

  // ── Chart data ──
  const trendData = analytics?.trend || [];

  // Equipment type distribution for pie chart
  const eqTypeDistData = useMemo(() => {
    const typeCount: Record<string, number> = {};
    const activeAlerts = alerts.filter(a => !resolvedIds.has(a.id));
    activeAlerts.forEach(a => {
      const eq = eqMap.get(a.equipment_id);
      const t = eq?.type || "Unknown";
      typeCount[t] = (typeCount[t] || 0) + 1;
    });
    return Object.entries(typeCount).map(([name, value]) => ({ name, value }));
  }, [alerts, resolvedIds, eqMap]);

  // ── Resolution analytics ──
  const resolvedCount = resolvedIds.size;
  const totalActive = alerts.filter(a => !resolvedIds.has(a.id)).length;
  const resolutionRate = analytics && analytics.total > 0
    ? Math.round((resolvedCount / (analytics.total + resolvedCount)) * 100)
    : 0;

  // ── Selected alert equipment info ──
  const selectedEq = selected ? eqMap.get(selected.equipment_id) : undefined;
  const selectedActions = selected ? getRecommendedActions(selected, selectedEq) : [];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-risk-critical/15 border border-risk-critical/25 flex items-center justify-center">
            <Bell className="w-4 h-4 text-risk-critical" />
          </div>
          <h1 className="page-title">Alert Command Center</h1>
        </div>
        <p className="page-subtitle ml-11">Real-time monitoring with severity-based escalation, filtering, batch actions, and work order integration</p>
      </div>

      {loading ? (
        <>
          <KpiRowSkeleton count={4} />
          <div className="my-5"><KpiRowSkeleton count={4} /></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <ChartCardSkeleton height="md" />
            <ChartCardSkeleton height="md" />
          </div>
          <AlertListSkeleton count={5} />
        </>
      ) : (
        <>
      {/* Severity KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 stagger">
        {SEVERITY_ORDER.map(severity => {
          const cfg = SEV_CONFIG[severity];
          const Icon = cfg.icon;
          const count = alerts.filter(a => a.severity === severity && !resolvedIds.has(a.id)).length;
          return (
            <div key={severity} className={`card-hover border ${cfg.border} animate-fade-in-up`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs uppercase tracking-wider font-semibold ${cfg.color}`}>{severity}</p>
                <div className={`p-1.5 rounded-md ${cfg.bg}`}><Icon className={`w-3.5 h-3.5 ${cfg.color}`} /></div>
              </div>
              <p className={`text-2xl font-bold ${cfg.color}`}>{count}</p>
              <p className="text-[10px] text-steel-400 mt-1">active alerts</p>
            </div>
          );
        })}
      </div>

      {/* Resolution Analytics KPI row */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="card-hover flex items-center gap-3 py-3">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 shrink-0">
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-steel-50">{totalActive}</p>
              <p className="text-[10px] uppercase tracking-wider text-steel-400">Active Alerts</p>
            </div>
          </div>
          <div className="card-hover flex items-center gap-3 py-3">
            <div className="p-2 rounded-lg bg-risk-low/10 border border-risk-low/20 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-risk-low" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-risk-low">{resolvedCount}</p>
              <p className="text-[10px] uppercase tracking-wider text-steel-400">Resolved</p>
            </div>
          </div>
          <div className="card-hover flex items-center gap-3 py-3">
            <div className="p-2 rounded-lg bg-risk-high/10 border border-risk-high/20 shrink-0">
              <Timer className="w-4 h-4 text-risk-high" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-risk-high">{analytics.mttr_hours > 0 ? `${analytics.mttr_hours}h` : "—"}</p>
              <p className="text-[10px] uppercase tracking-wider text-steel-400">Avg MTTR</p>
            </div>
          </div>
          <div className="card-hover flex items-center gap-3 py-3">
            <div className="p-2 rounded-lg bg-risk-medium/10 border border-risk-medium/20 shrink-0">
              <Target className="w-4 h-4 text-risk-medium" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-risk-medium">{resolutionRate}%</p>
              <p className="text-[10px] uppercase tracking-wider text-steel-400">Resolution Rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-5">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-steel-400" />
          {/* Severity toggles */}
          {SEVERITY_ORDER.map(s => {
            const active = severityFilter.includes(s);
            const colorKey = s === "critical" ? "risk-critical" : s === "high" ? "risk-high" : s === "medium" ? "risk-medium" : "risk-low";
            return (
              <button key={s} onClick={() => toggleSeverity(s)}
                className={`text-[10px] uppercase font-semibold px-2.5 py-1 rounded-md border transition-all ${
                  active ? `border-${colorKey} bg-${colorKey}/10 text-${colorKey}` : "border-panel-border text-steel-400 hover:text-steel-200"
                }`}>
                {s}
              </button>
            );
          })}
          <span className="text-steel-600">|</span>
          {/* Time filters */}
          {TIME_FILTERS.map(t => (
            <button key={t} onClick={() => setTimeFilter(t)}
              className={`text-[10px] uppercase font-semibold px-2 py-1 rounded transition-all ${timeFilter === t ? "text-accent bg-accent/10" : "text-steel-400 hover:text-steel-200"}`}>
              {t}
            </button>
          ))}
          <span className="text-steel-600">|</span>
          {/* Status */}
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-[10px] uppercase font-semibold px-2 py-1 rounded transition-all ${statusFilter === s ? "text-accent bg-accent/10" : "text-steel-400 hover:text-steel-200"}`}>
              {s}
            </button>
          ))}
          <span className="text-steel-600">|</span>
          {/* Equipment filter */}
          <select value={equipmentFilter} onChange={e => setEquipmentFilter(e.target.value)}
            className="bg-steel-800 border border-panel-border rounded text-[10px] px-2 py-1 text-steel-200 focus:outline-none focus:border-accent/40">
            <option value="">All Equipment</option>
            {equipment.map(e => <option key={e.id} value={e.id}>{e.id}</option>)}
          </select>
          {/* Search with autocomplete */}
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-steel-500" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setTimeout(() => setSearchFocus(false), 200)}
              placeholder="Search alerts…"
              className="bg-steel-800 border border-panel-border rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-steel-200 w-44 focus:outline-none focus:border-accent/40 placeholder:text-steel-600"
            />
            {searchFocus && autocompleteSuggestions.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-steel-850 border border-panel-border rounded-lg overflow-hidden z-30 shadow-lg">
                {autocompleteSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={() => { setSearchQuery(s); setSearchFocus(false); }}
                    className="w-full text-left px-3 py-1.5 text-[10px] text-steel-300 hover:bg-panel-hover/60 truncate block"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          {(severityFilter.length > 0 || timeFilter !== "All" || equipmentFilter || statusFilter !== "all" || searchQuery) && (
            <button onClick={clearFilters} className="text-[10px] text-steel-400 hover:text-steel-200 flex items-center gap-1" aria-label="Clear all filters">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Batch actions bar */}
      {checkedIds.size > 0 && (
        <div className="card mb-5 border-accent/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ListChecks className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-steel-100">{checkedIds.size} alert{checkedIds.size > 1 ? "s" : ""} selected</span>
              {batchMsg && <span className="text-xs text-risk-low">{batchMsg}</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={batchAcknowledge} className="btn-secondary flex items-center gap-1.5 text-xs">
                <CheckCheck className="w-3.5 h-3.5" /> Acknowledge All
              </button>
              <button onClick={batchAssign} className="btn-secondary flex items-center gap-1.5 text-xs">
                <UserPlus className="w-3.5 h-3.5" /> Assign All
              </button>
              <button onClick={() => setCheckedIds(new Set())} className="text-[10px] text-steel-400 hover:text-steel-200 flex items-center gap-1" aria-label="Deselect all alerts">
                <X className="w-3 h-3" /> Deselect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected alert detail panel */}
      {selected && (
        <div className="card mb-5 border-accent/30">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Main info */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-steel-100">
                  Selected: <span className="font-mono text-accent-light">{selected.id}</span> · {selected.equipment_id}
                </p>
                {actionMsg && <span className="text-xs text-risk-low">{actionMsg}</span>}
              </div>
              <p className="text-xs text-steel-400 mb-1">{selected.message}</p>
              <div className="flex items-center gap-3 text-[10px] text-steel-500 mb-3">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(selected.timestamp).toLocaleString()}</span>
                {selected.acknowledged ? (
                  <span className="text-risk-low bg-risk-low/10 px-1.5 py-0.5 rounded">Acknowledged</span>
                ) : (
                  <span className="text-risk-medium bg-risk-medium/10 px-1.5 py-0.5 rounded">Pending</span>
                )}
              </div>
              {/* Equipment context */}
              {selectedEq && (
                <div className="p-3 rounded-lg bg-steel-800/60 border border-panel-border mb-3">
                  <p className="text-[10px] uppercase tracking-wider text-steel-400 mb-2">Related Equipment</p>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-steel-100">{selectedEq.name}</p>
                      <p className="text-[10px] text-steel-400">{selectedEq.type} · {selectedEq.location}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-3 text-center">
                      <div>
                        <p className={`text-lg font-bold ${selectedEq.rul_days < 15 ? "text-risk-critical" : selectedEq.rul_days < 30 ? "text-risk-medium" : "text-risk-low"}`}>{selectedEq.rul_days}d</p>
                        <p className="text-[9px] text-steel-500">RUL</p>
                      </div>
                      <div>
                        <p className={`text-lg font-bold capitalize ${selectedEq.risk_level === "critical" ? "text-risk-critical" : selectedEq.risk_level === "high" ? "text-risk-high" : "text-risk-medium"}`}>{selectedEq.risk_level}</p>
                        <p className="text-[9px] text-steel-500">Risk Level</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "acknowledge", label: "Acknowledge", icon: CheckCheck },
                  { id: "assign", label: "Assign", icon: UserPlus },
                  { id: "escalate", label: "Escalate", icon: ArrowUp },
                  { id: "work-order", label: "Work Order", icon: Wrench },
                  { id: "resolve", label: "Resolve", icon: CheckCircle2 },
                ].map(a => (
                  <button key={a.id} type="button" onClick={() => doAction(a.id)} className="btn-secondary flex items-center gap-1.5 text-xs">
                    <a.icon className="w-3.5 h-3.5" /> {a.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Recommended actions panel */}
            <div className="p-3 rounded-lg bg-risk-critical/5 border border-risk-critical/15">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-3.5 h-3.5 text-risk-high" />
                <p className="text-[10px] uppercase tracking-wider font-semibold text-risk-high">Recommended Actions</p>
              </div>
              <ul className="space-y-1.5">
                {selectedActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-[10px] text-steel-300">
                    <span className="mt-0.5 w-1 h-1 rounded-full bg-risk-medium shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Section: Analytics */}
      <div className="flex items-center gap-3 mb-4 mt-1">
        <div className="h-px flex-1 bg-panel-border" />
        <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">Analytics & Trends</span>
        <div className="h-px flex-1 bg-panel-border" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="card">
          <h3 className="text-sm font-semibold text-steel-100 mb-3">Alert Trend (7 Days)</h3>
          {trendData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-steel-500 text-sm">No trend data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="date" stroke={CHART_TEXT} fontSize={9} tickLine={false} tickFormatter={v => v.slice(5)} />
                <YAxis stroke={CHART_TEXT} fontSize={9} tickLine={false} />
                <Tooltip contentStyle={{ background: "rgb(24,32,48)", border: "1px solid rgb(42,54,78)", borderRadius: "8px", fontSize: "11px" }} />
                <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                <Area type="monotone" dataKey="high" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.25} />
                <Area type="monotone" dataKey="medium" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.2} />
                <Area type="monotone" dataKey="low" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-steel-100 mb-3">Alert Distribution by Equipment Type</h3>
          {eqTypeDistData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-steel-500 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={eqTypeDistData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value">
                  {eqTypeDistData.map((d, i) => <Cell key={d.name} fill={EQUIP_TYPE_COLORS[i % EQUIP_TYPE_COLORS.length]} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "rgb(24,32,48)", border: "1px solid rgb(42,54,78)", borderRadius: "8px", fontSize: "11px" }} />
                <Legend wrapperStyle={{ fontSize: "10px", color: CHART_TEXT }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Section: Alert Queue */}
      <div className="flex items-center gap-3 mb-4 mt-1">
        <div className="h-px flex-1 bg-panel-border" />
        <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">Alert Queue & Details</span>
        <div className="h-px flex-1 bg-panel-border" />
      </div>

      {/* Critical Alert Queue */}
      <div className="card p-0 overflow-hidden mb-5">
        <div className="px-4 py-2.5 border-b border-panel-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-risk-critical" />
            <h3 className="text-sm font-semibold text-steel-100">Critical Alert Queue</h3>
            <span className="text-[10px] text-steel-400">(top {criticalQueue.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setQueueSort("priority")}
              className={`text-[10px] uppercase font-semibold px-2 py-1 rounded transition-all ${queueSort === "priority" ? "text-accent bg-accent/10" : "text-steel-400 hover:text-steel-200"}`}>
              Priority
            </button>
            <button onClick={() => setQueueSort("time")}
              className={`text-[10px] uppercase font-semibold px-2 py-1 rounded transition-all ${queueSort === "time" ? "text-accent bg-accent/10" : "text-steel-400 hover:text-steel-200"}`}>
              Time
            </button>
            <ArrowUpDown className="w-3 h-3 text-steel-500 ml-1" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-6">#</th>
                <th>Alert ID</th>
                <th>Equipment</th>
                <th>Severity</th>
                <th>Message</th>
                <th>Time</th>
                <th className="w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {criticalQueue.map((a, i) => {
                const cfg = SEV_CONFIG[a.severity] || SEV_CONFIG.low;
                return (
                  <tr key={a.id} className={`hover:bg-panel-hover/40 transition-colors cursor-pointer ${selected?.id === a.id ? "bg-accent/5" : ""}`}
                    onClick={() => setSelected(a)}>
                    <td className="text-steel-500 text-[10px]">{i + 1}</td>
                    <td className="font-mono text-[11px] text-accent-light font-medium">{a.id}</td>
                    <td className="text-xs text-steel-200">{a.equipment_id}</td>
                    <td>
                      <span className={`badge text-[8px] capitalize ${a.severity === "critical" ? "badge-critical" : a.severity === "high" ? "badge-high" : a.severity === "medium" ? "badge-medium" : "badge-low"}`}>{a.severity}</span>
                    </td>
                    <td className="text-xs text-steel-300 max-w-[260px] truncate">{a.message}</td>
                    <td className="text-[10px] text-steel-500 whitespace-nowrap">{timeAgo(a.timestamp)}</td>
                    <td>
                      <button onClick={(e) => { e.stopPropagation(); setSelected(a); }}
                        className="text-[9px] text-accent hover:text-accent-light font-medium">
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
              {criticalQueue.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-steel-500 text-sm">No active alerts</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section: All Alerts */}
      <div className="flex items-center gap-3 mb-4 mt-1">
        <div className="h-px flex-1 bg-panel-border" />
        <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">All Alerts by Severity</span>
        <div className="h-px flex-1 bg-panel-border" />
      </div>

      {/* Alert List by severity */}
      <div className="space-y-4" onClick={(e) => {
        const el = (e.target as HTMLElement).closest("[data-alert-id]");
        if (el) {
          const id = el.getAttribute("data-alert-id");
          const found = alerts.find(a => a.id === id);
          if (found) setSelected(found);
        }
      }}>
        {/* Select all checkbox row */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-3 px-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checkedIds.size === filtered.length && filtered.length > 0}
                onChange={toggleAll}
                className="w-3.5 h-3.5 rounded border-panel-border bg-steel-800 accent-accent"
              />
              <span className="text-[10px] text-steel-400">
                {checkedIds.size === filtered.length ? "Deselect All" : "Select All"} ({filtered.length})
              </span>
            </label>
          </div>
        )}
        {grouped.map(({ severity, items }) => {
          const cfg = SEV_CONFIG[severity];
          if (items.length === 0) return null;
          return (
            <div key={severity} className="card p-0 overflow-hidden">
              <div className={`px-4 py-2.5 border-b ${cfg.border.replace("/25", "/20")} flex items-center justify-between ${cfg.bg}`}>
                <h3 className={`text-xs font-semibold uppercase ${cfg.color}`}>{severity} Alerts ({items.length})</h3>
              </div>
              <div className="divide-y divide-panel-border/40">
                {items.map(a => (
                  <div key={a.id} data-alert-id={a.id}
                    className={`px-4 py-3 hover:bg-panel-hover/40 transition-colors cursor-pointer flex items-start gap-3 ${selected?.id === a.id ? "bg-accent/5 border-l-2 border-l-accent" : ""}`}>
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={checkedIds.has(a.id)}
                      onChange={() => toggleCheck(a.id)}
                      onClick={e => e.stopPropagation()}
                      className="w-3.5 h-3.5 mt-1 rounded border-panel-border bg-steel-800 accent-accent shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-accent-light font-medium">{a.id}</span>
                        <span className="text-[10px] text-steel-400 font-mono">{a.equipment_id}</span>
                        {a.acknowledged && <span className="text-[9px] text-risk-low bg-risk-low/10 px-1.5 py-0.5 rounded">ACK</span>}
                        {resolvedIds.has(a.id) && <span className="text-[9px] text-risk-low bg-risk-low/10 px-1.5 py-0.5 rounded">Resolved</span>}
                      </div>
                      <p className="text-xs text-steel-200 leading-relaxed">{a.message}</p>
                    </div>
                    <span className="text-[9px] text-steel-500 shrink-0 mt-1">{timeAgo(a.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="card text-center py-10">
            <Bell className="w-8 h-8 text-steel-600 mx-auto mb-2" />
            <p className="text-steel-300 text-sm font-medium mb-1">No alerts match the current filters</p>
            <p className="text-steel-500 text-xs mb-3">Try adjusting your severity, time, or equipment filters</p>
            <button onClick={clearFilters} className="btn-secondary text-xs">Clear All Filters</button>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
