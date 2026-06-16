"use client";

import { useEffect, useState } from "react";
import { api, type AdminUser, type AdminMetrics } from "@/services/api";
import { toast } from "sonner";
import {
  Shield, Users, Activity, Settings, Check, Trash2, Plus, Server, Cpu, Database, Zap,
  TrendingUp, BarChart2, PieChart, RefreshCw, Filter, Search,
} from "lucide-react";
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { KpiRowSkeleton, ChartCardSkeleton, TableSkeleton, PageHeaderSkeleton } from "@/components/Skeletons";

const CHART_GRID = "rgb(42,54,78)";
const CHART_TEXT = "rgb(148,163,184)";
const AGENT_COLORS = ["#3b82f6", "#ea580c", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#06b6d4"];

function AgentActivityChart({ metrics }: { metrics: AdminMetrics }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-steel-100 mb-3 flex items-center gap-2">
        <Cpu className="w-4 h-4 text-accent" /> Agent Activity Metrics
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={metrics.agent_activity} layout="vertical" margin={{ top: 0, right: 5, left: 80, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
          <XAxis type="number" stroke={CHART_TEXT} fontSize={9} tickLine={false} />
          <YAxis type="category" dataKey="agent" stroke={CHART_TEXT} fontSize={9} tickLine={false} width={80} />
          <Tooltip contentStyle={{ background: "rgb(24,32,48)", border: "1px solid rgb(42,54,78)", borderRadius: "8px", fontSize: "11px" }} />
          <Bar dataKey="invocations" radius={[0, 4, 4, 0]} maxBarSize={18} name="Invocations">
            {metrics.agent_activity.map((_, i) => <Cell key={i} fill={AGENT_COLORS[i % AGENT_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {metrics.agent_activity.map((a, i) => (
          <div key={a.agent} className="flex items-center justify-between p-2 rounded bg-steel-800/60 border border-panel-border text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: AGENT_COLORS[i % AGENT_COLORS.length] }} />
              {a.agent}
            </span>
            <span className="text-steel-400">{a.success_rate}% SR · {a.avg_latency_ms}ms</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleDistributionPie({ data }: { data: { name: string; value: number }[] }) {
  const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#8b5cf6"];
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-steel-100 mb-3 flex items-center gap-2">
        <PieChart className="w-4 h-4 text-accent" /> User Role Distribution
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <RePieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
          </Pie>
          <Tooltip contentStyle={{ background: "rgb(24,32,48)", border: "1px solid rgb(42,54,78)", borderRadius: "8px", fontSize: "11px" }} />
          <Legend wrapperStyle={{ fontSize: "10px", color: CHART_TEXT }} />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}

const ACTION_ICONS: Record<string, typeof Search> = {
  create: Plus, delete: Trash2, update: Settings, login: Users, logout: Activity, access: Shield,
};

export default function AdminPage() {
  const [roles, setRoles] = useState<{ id: string; name: string; permissions: string[] }[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [auditLogs, setAuditLogs] = useState<Record<string, unknown>[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [tab, setTab] = useState<"overview" | "users" | "roles" | "audit" | "settings">("overview");
  const [newUser, setNewUser] = useState({ email: "", name: "", role_id: "engineer" });
  const [auditFilter, setAuditFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAdminRoles(),
      api.getAdminUsers(),
      api.getAdminDashboard(),
      api.getAuditLogs(),
      api.getAdminSettings(),
      api.getAdminMetrics(),
    ]).then(([r, u, d, a, s, m]) => {
      setRoles(r);
      setUsers(u);
      setDashboard(d);
      setAuditLogs(a);
      setSettings(s);
      setMetrics(m);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const createUser = async () => {
    try {
      await api.createAdminUser(newUser);
      toast.success("User created", { description: newUser.email || newUser.name });
      api.getAdminUsers().then(setUsers);
      setNewUser({ email: "", name: "", role_id: "engineer" });
    } catch {
      toast.error("Failed to create user");
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Shield },
    { id: "users", label: "Users", icon: Users },
    { id: "roles", label: "Roles", icon: Shield },
    { id: "audit", label: "Audit Logs", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  const roleDistribution = roles.map(r => ({ name: r.name, value: users.filter(u => u.role_id === r.id).length }));
  const auditFiltered = auditFilter ? auditLogs.filter(l => {
    const action = String(l.action || "").toLowerCase();
    const resource = String(l.resource || "").toLowerCase();
    const user = String(l.user || "").toLowerCase();
    const q = auditFilter.toLowerCase();
    return action.includes(q) || resource.includes(q) || user.includes(q);
  }) : auditLogs;

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
            <Shield className="w-4 h-4 text-accent" />
          </div>
          <h1 className="page-title">Admin Dashboard</h1>
        </div>
        <p className="page-subtitle ml-11">Users, roles, permissions, audit logs, system metrics, and configuration</p>
      </div>

      {loading ? (
        <>
          <KpiRowSkeleton count={4} />
          <div className="my-5"><KpiRowSkeleton count={4} /></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCardSkeleton height="md" />
            <ChartCardSkeleton height="md" />
          </div>
          <div className="mt-5"><TableSkeleton rows={6} cols={4} /></div>
        </>
      ) : (
        <>
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              tab === t.id ? "border-accent/40 bg-accent/10 text-accent-light" : "border-panel-border text-steel-300 hover:bg-panel-hover"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-5">
          {/* Section: System KPIs */}
          <div className="flex items-center gap-3 mb-1">
            <div className="h-px flex-1 bg-panel-border" />
            <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">System Overview</span>
            <div className="h-px flex-1 bg-panel-border" />
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: metrics?.total_users ?? dashboard?.users ?? 0, icon: Users, color: "text-accent" },
              { label: "Active Users", value: metrics?.active_users ?? dashboard?.active_users ?? 0, icon: TrendingUp, color: "text-risk-low" },
              { label: "Roles", value: metrics?.total_roles ?? dashboard?.roles ?? 0, icon: Shield, color: "text-risk-medium" },
              { label: "Audit Events (24h)", value: metrics?.audit_events_24h ?? dashboard?.audit_events_24h ?? 0, icon: Activity, color: "text-risk-high" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card-hover text-center py-5">
                <div className="flex justify-center mb-2"><Icon className={`w-4 h-4 ${color}`} /></div>
                <p className={`text-2xl font-bold ${color}`}>{String(value)}</p>
                <p className="text-[10px] text-steel-400 mt-1 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>

          {/* Second KPI row */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card-hover flex items-center gap-3 py-3">
                <Server className="w-4 h-4 text-accent" />
                <div><p className="text-lg font-bold text-steel-50">{metrics.api_requests_24h.toLocaleString()}</p><p className="text-[9px] text-steel-400 uppercase">API Requests (24h)</p></div>
              </div>
              <div className="card-hover flex items-center gap-3 py-3">
                <Database className="w-4 h-4 text-risk-medium" />
                <div><p className="text-lg font-bold text-steel-50">{metrics.ingestion_volume_24h.toLocaleString()}</p><p className="text-[9px] text-steel-400 uppercase">Data Ingestion (24h)</p></div>
              </div>
              <div className="card-hover flex items-center gap-3 py-3">
                <Cpu className="w-4 h-4 text-risk-low" />
                <div><p className="text-lg font-bold text-steel-50">{metrics.agent_activity.length}</p><p className="text-[9px] text-steel-400 uppercase">Active Agents</p></div>
              </div>
              <div className="card-hover flex items-center gap-3 py-3">
                <Zap className="w-4 h-4 text-accent" />
                <div><p className="text-lg font-bold text-steel-50">{metrics.agent_activity.reduce((s, a) => s + a.invocations, 0)}</p><p className="text-[9px] text-steel-400 uppercase">Total Invocations</p></div>
              </div>
            </div>
          )}

          {/* Charts row */}
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <AgentActivityChart metrics={metrics} />
              <RoleDistributionPie data={roleDistribution} />
            </div>
          )}
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Add User</h3>
            <div className="grid grid-cols-3 gap-3">
              <input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="bg-steel-800 border border-panel-border rounded-lg px-3 py-2 text-xs text-steel-200 focus:outline-none focus:border-accent/40" />
              <input placeholder="Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="bg-steel-800 border border-panel-border rounded-lg px-3 py-2 text-xs text-steel-200 focus:outline-none focus:border-accent/40" />
              <select value={newUser.role_id} onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })}
                className="bg-steel-800 border border-panel-border rounded-lg px-3 py-2 text-xs text-steel-200 focus:outline-none focus:border-accent/40">
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <button type="button" onClick={createUser} className="btn-primary text-sm">Create User</button>
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="data-table">
              <thead><tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th>
              </tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="text-xs text-steel-100">{u.name}</td>
                    <td className="text-xs text-steel-400">{u.email}</td>
                    <td className="text-xs">{u.role_id}</td>
                    <td><span className={`badge text-[9px] ${u.enabled ? "badge-low" : "badge-high"}`}>{u.enabled ? "Active" : "Disabled"}</span></td>
                    <td>
                      <button type="button" onClick={() => api.deleteAdminUser(u.id).then(() => { api.getAdminUsers().then(setUsers); toast.success("User deleted", { description: u.name }); }).catch(() => toast.error("Failed to delete user"))}
                        className="text-steel-500 hover:text-risk-critical" aria-label={`Delete user ${u.name}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="card-hover">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-sm">{role.name}</h3>
              </div>
              <ul className="space-y-1.5">
                {role.permissions.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-xs text-steel-300">
                    <Check className="w-3 h-3 text-risk-low" />{p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {tab === "audit" && (
        <div className="space-y-4">
          <div className="card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-steel-500" />
              <input
                value={auditFilter}
                onChange={e => setAuditFilter(e.target.value)}
                placeholder="Filter by action, resource, or user…"
                className="w-full bg-steel-800 border border-panel-border rounded-lg pl-9 pr-3 py-2 text-xs text-steel-200 focus:outline-none focus:border-accent/40 placeholder:text-steel-600"
              />
            </div>
          </div>
          <div className="card p-0 overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto divide-y divide-panel-border/40">
              {auditFiltered.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Activity className="w-8 h-8 text-steel-600 mx-auto mb-2" />
                  <p className="text-steel-400 text-sm">No audit logs found.</p>
                </div>
              ) : (
                auditFiltered.map((log, i) => {
                  const action = String(log.action || "unknown");
                  const ActionIcon = ACTION_ICONS[action.toLowerCase()] || Activity;
                  return (
                    <div key={String(log.id || i)} className="flex items-center gap-3 px-4 py-3 hover:bg-panel-hover/40 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-steel-800 border border-panel-border flex items-center justify-center shrink-0">
                        <ActionIcon className="w-3 h-3 text-steel-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-accent-light font-medium">{action}</span>
                          <span className="text-[10px] text-steel-400">{String(log.user)}</span>
                        </div>
                        <p className="text-[10px] text-steel-500 mt-0.5">Resource: {String(log.resource)}</p>
                      </div>
                      <span className="text-[10px] text-steel-500 shrink-0">{new Date(String(log.timestamp)).toLocaleString()}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="card max-w-lg space-y-4">
          {Object.entries(settings).map(([key, val]) => (
            <div key={key}>
              <label className="text-xs text-steel-400 capitalize">{key.replace(/_/g, " ")}</label>
              <input
                value={String(val)}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                className="bg-steel-800 border border-panel-border rounded-lg px-3 py-2 text-xs text-steel-200 w-full mt-1 focus:outline-none focus:border-accent/40"
              />
            </div>
          ))}
          <button type="button" onClick={() => api.updateAdminSettings(settings).then(() => toast.success("Settings saved")).catch(() => toast.error("Failed to save settings"))} className="btn-primary text-sm">Save Settings</button>
        </div>
      )}
        </>
      )}
    </div>
  );
}
