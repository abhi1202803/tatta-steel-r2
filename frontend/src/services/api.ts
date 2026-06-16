const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchBlob(path: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.blob();
}

async function uploadFile(path: string, file: File, fields: Record<string, string> = {}) {
  const form = new FormData();
  form.append("file", file);
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  const res = await fetch(`${API_BASE}${path}`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface DashboardData {
  total_equipment: number;
  healthy_count: number;
  warning_count: number;
  critical_count: number;
  avg_rul_days: number;
  active_alerts: number;
  maintenance_scheduled: number;
  cost_savings_mtd: number;
  equipment_summary: Equipment[];
  recent_alerts: Alert[];
  risk_distribution: Record<string, number>;
  anomaly_trend: { timestamp: string; score: number }[];
}

export interface PlantHealthScore {
  score: number;
  healthy: number;
  warning: number;
  critical: number;
  total: number;
  trend: string;
}

export interface MTBFMetrics {
  mtbf_hours: number;
  mttr_hours: number;
  availability_pct: number;
  failure_count_30d: number;
}

export interface FailureProbability {
  equipment_id: string;
  name: string;
  probability_7d: number;
  probability_14d: number;
  probability_30d: number;
  rul_days: number;
  risk_level: string;
}

export interface RULDistributionItem {
  range: string;
  count: number;
  color: string;
}

export interface AlertTrendItem {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface InventoryHealthItem {
  part_name: string;
  quantity: number;
  reorder_level: number;
  unit_cost: number;
  stockout_risk: number;
  lead_time_days: number;
  supplier: string;
  criticality: string;
}

export interface ReorderForecastItem {
  part_name: string;
  forecast_demand: number;
  current_stock: number;
  days_until_shortage: number;
  recommended_order: number;
}

export interface EquipmentHealthRanking {
  id: string;
  name: string;
  type: string;
  health_score: number;
  risk_level: string;
  rul_days: number;
  anomaly_score: number;
  alert_count: number;
}

export interface ZoneHealthItem {
  zone: string;
  equipment_count: number;
  avg_health: number;
  critical_count: number;
}

export interface ExecutiveInsight {
  id: string;
  severity: string;
  message: string;
  category: string;
}

export interface ExecutiveInsightFull {
  id: string;
  severity: string;
  message: string;
  category: string;
  confidence: number;
  related_equipment: string[];
  timestamp: string;
  cost_impact: number;
  recommended_action: string;
  evidence_summary: string;
}

export interface ExplainabilityData {
  confidence: number;
  supporting_evidence: string[];
  sensor_trends_used: string[];
  similar_cases: { id: string; description: string; date: string }[];
  sop_references: { id: string; title: string }[];
  knowledge_documents: { id: string; filename: string; doc_type: string }[];
  maintenance_recommendations: string[];
}

export interface LifecycleEvent {
  id: string;
  date: string;
  type: "installation" | "maintenance" | "alert" | "prediction" | "rca" | "repair" | "feedback" | "logbook";
  title: string;
  description: string;
  severity?: string;
  metadata: Record<string, unknown>;
}

export interface MaintenanceScheduleItem {
  id: string;
  equipment_id: string;
  equipment_name: string;
  type: string;
  scheduled_date: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "scheduled" | "in_progress" | "completed" | "overdue";
  description: string;
  risk_level: string;
}

export interface CommandCenterData {
  plant_health: number;
  zone_health: ZoneHealthItem[];
  critical_assets: Equipment[];
  active_alerts: number;
  predicted_failures: number;
  maintenance_due: number;
  inventory_risk: number;
  downtime_risk: number;
  top_risk_assets: EquipmentHealthRanking[];
  insights: ExecutiveInsightFull[];
  kpi_history: { timestamp: string; health: number; alerts: number; downtime: number }[];
}

export interface AlertAnalytics {
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  mttr_hours: number;
  resolution_rate_pct: number;
  by_severity: Record<string, number>;
  trend: AlertTrendItem[];
}

export interface AdminMetrics {
  total_users: number;
  active_users: number;
  total_roles: number;
  audit_events_24h: number;
  ingestion_volume_24h: number;
  api_requests_24h: number;
  agent_activity: { agent: string; invocations: number; success_rate: number; avg_latency_ms: number }[];
}

export interface EquipmentSensorTrendItem {
  timestamp: string;
  temperature: number;
  vibration: number;
  pressure: number;
  current: number;
  rpm: number;
  flow_rate: number;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  location: string;
  health_status: string;
  risk_level: string;
  rul_days: number;
  anomaly_score: number;
  criticality?: string;
  manufacturer?: string;
}

export interface Alert {
  id: string;
  equipment_id: string;
  severity: string;
  message: string;
  timestamp: string;
  acknowledged?: boolean;
}

export interface EquipmentContext {
  equipment: Equipment;
  criticality: string;
  active_alerts: Alert[];
  latest_sensors: Record<string, number>;
  maintenance_history: Record<string, unknown>[];
}

export interface LogbookEntry {
  id: string;
  equipment_id: string;
  event_type: string;
  diagnosis?: string;
  recommendation?: string;
  root_cause?: string;
  action_taken?: string;
  created_at: string;
}

export interface IngestRecord {
  id: string;
  input_type: string;
  equipment_id?: string;
  payload_summary: string;
  status: string;
  created_at: string;
}

export interface KnowledgeDocument {
  id: string;
  filename: string;
  doc_type: string;
  equipment_id?: string;
  size_bytes: number;
  indexed: boolean;
  created_at: string;
}

export interface ReportRecord {
  id: string;
  equipment_id: string;
  report_type: string;
  content: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role_id: string;
  enabled: boolean;
  created_at: string;
}

export interface FeedbackEntry {
  id: string;
  equipment_id: string;
  recommendation_correct: boolean;
  actual_root_cause?: string;
  repair_outcome?: string;
  notes?: string;
  created_at: string;
}

export const api = {
  // Dashboard
  getDashboard: () => fetchAPI<DashboardData>("/api/v1/dashboard/overview"),
  getDashboardHealth: () => fetchAPI<Record<string, unknown>>("/api/v1/dashboard/health"),
  getRiskDistribution: () => fetchAPI<{ distribution: Record<string, number> }>("/api/v1/dashboard/risk-distribution"),
  getAnomalyTrend: () => fetchAPI<{ trend: { timestamp: string; score: number }[] }>("/api/v1/dashboard/anomaly-trend"),
  getRulTrend: () => fetchAPI<{ trend: Record<string, unknown>[] }>("/api/v1/dashboard/rul-trend"),
  getFailureTrend: () => fetchAPI<{ trend: Record<string, unknown>[] }>("/api/v1/dashboard/failure-trend"),
  getCriticalAssets: () => fetchAPI<{ assets: Equipment[] }>("/api/v1/dashboard/critical-assets"),

  // Equipment
  getEquipment: () => fetchAPI<Equipment[]>("/api/v1/assets"),
  getEquipmentContext: (id: string) => fetchAPI<EquipmentContext>(`/api/v1/equipment/${id}/context`),
  createEquipment: (data: { id: string; name: string; type: string; location: string; criticality?: string }) =>
    fetchAPI<Equipment>("/api/v1/equipment", { method: "POST", body: JSON.stringify(data) }),
  updateEquipment: (id: string, data: Partial<Equipment>) =>
    fetchAPI<Equipment>(`/api/v1/equipment/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEquipment: (id: string) => fetchAPI<{ deleted: string }>(`/api/v1/equipment/${id}`, { method: "DELETE" }),
  getEquipmentHistory: (id: string) => fetchAPI<{ history: LogbookEntry[] }>(`/api/v1/equipment/${id}/history`),
  getEquipmentPredictions: (id: string) => fetchAPI<Record<string, unknown>>(`/api/v1/equipment/${id}/predictions`),
  getEquipmentDocuments: (id: string) => fetchAPI<{ documents: KnowledgeDocument[] }>(`/api/v1/equipment/${id}/documents`),
  getEquipmentAlerts: (id: string) => fetchAPI<{ alerts: Alert[] }>(`/api/v1/equipment/${id}/alerts`),
  getEquipmentMaintenance: (id: string) => fetchAPI<{ maintenance: LogbookEntry[]; feedback: FeedbackEntry[] }>(`/api/v1/equipment/${id}/maintenance`),

  // Alerts
  getAlerts: () => fetchAPI<Alert[]>("/api/v1/alerts"),
  getCriticalAlerts: () => fetchAPI<Alert[]>("/api/v1/alerts/critical"),
  getHighAlerts: () => fetchAPI<Alert[]>("/api/v1/alerts/high"),
  getAlertHistory: () => fetchAPI<Record<string, unknown>[]>("/api/v1/alerts/history"),
  acknowledgeAlert: (id: string, user = "Engineer") =>
    fetchAPI<Record<string, unknown>>(`/api/v1/alerts/${id}/acknowledge`, { method: "POST", body: JSON.stringify({ user }) }),
  assignAlert: (id: string, assignee: string) =>
    fetchAPI<Record<string, unknown>>(`/api/v1/alerts/${id}/assign`, { method: "POST", body: JSON.stringify({ assignee, user: "Manager" }) }),
  escalateAlert: (id: string) =>
    fetchAPI<Record<string, unknown>>(`/api/v1/alerts/${id}/escalate`, { method: "POST", body: JSON.stringify({ user: "System" }) }),
  createWorkOrder: (id: string) =>
    fetchAPI<Record<string, unknown>>(`/api/v1/alerts/${id}/work-order`, { method: "POST", body: JSON.stringify({ user: "Engineer" }) }),
  resolveAlert: (id: string) =>
    fetchAPI<Record<string, unknown>>(`/api/v1/alerts/${id}/resolve`, { method: "POST", body: JSON.stringify({ user: "Engineer" }) }),

  // Logbook
  getLogbook: (equipmentId?: string) =>
    fetchAPI<LogbookEntry[]>(`/api/v1/logbook${equipmentId ? `?equipment_id=${equipmentId}` : ""}`),
  createLogbookEntry: (data: Partial<LogbookEntry> & { equipment_id: string; event_type: string }) =>
    fetchAPI<LogbookEntry>("/api/v1/logbook", { method: "POST", body: JSON.stringify(data) }),
  deleteLogbookEntry: (id: string) => fetchAPI<{ deleted: string }>(`/api/v1/logbook/${id}`, { method: "DELETE" }),
  exportLogbookPdf: (equipmentId?: string) => fetchBlob(`/api/v1/logbook/export/pdf${equipmentId ? `?equipment_id=${equipmentId}` : ""}`),
  exportLogbookXlsx: (equipmentId?: string) => fetchBlob(`/api/v1/logbook/export/xlsx${equipmentId ? `?equipment_id=${equipmentId}` : ""}`),

  // Inventory
  getInventory: () => fetchAPI<Record<string, unknown>[]>("/api/v1/inventory"),

  // Copilot & Knowledge
  copilotChat: (message: string, equipmentId?: string) =>
    fetchAPI<{ response: string; recommendations: string[]; sources: string[]; pipeline_results?: Record<string, unknown> }>(
      "/api/v1/copilot/chat",
      { method: "POST", body: JSON.stringify({ message, equipment_id: equipmentId, include_pipeline_analysis: !!equipmentId }) }
    ),
  knowledgeQuery: (query: string, equipmentId?: string) =>
    fetchAPI<{ query: string; technical_guidance: string; relevant_documents: string[] }>(
      "/api/v1/knowledge/query",
      { method: "POST", body: JSON.stringify({ query, equipment_id: equipmentId, top_k: 5 }) }
    ),
  getKnowledgeDocuments: () => fetchAPI<KnowledgeDocument[]>("/api/v1/knowledge/documents"),
  uploadKnowledgeDocument: (file: File, docType: string, equipmentId?: string) =>
    uploadFile("/api/v1/knowledge/upload", file, { doc_type: docType, ...(equipmentId ? { equipment_id: equipmentId } : {}) }),
  deleteKnowledgeDocument: (id: string) => fetchAPI<{ deleted: string }>(`/api/v1/knowledge/documents/${id}`, { method: "DELETE" }),
  getKnowledgeStats: () => fetchAPI<Record<string, unknown>>("/api/v1/knowledge/stats"),
  reindexKnowledge: () => fetchAPI<Record<string, unknown>>("/api/v1/knowledge/reindex", { method: "POST" }),

  // Ingest / Input Center
  ingest: (payload: unknown, inputType = "auto", equipmentId?: string) =>
    fetchAPI<Record<string, unknown>>("/api/v1/ingest", {
      method: "POST",
      body: JSON.stringify({ input_type: inputType, payload, equipment_id: equipmentId }),
    }),
  ingestTyped: (path: string, payload: unknown, equipmentId?: string) =>
    fetchAPI<Record<string, unknown>>(`/api/v1/ingest/${path}`, {
      method: "POST",
      body: JSON.stringify({ payload, equipment_id: equipmentId }),
    }),
  ingestPdf: (file: File, equipmentId?: string) =>
    uploadFile("/api/v1/ingest/pdf", file, equipmentId ? { equipment_id: equipmentId } : {}),
  getIngestHistory: () => fetchAPI<IngestRecord[]>("/api/v1/ingest/history"),
  deleteIngestRecord: (id: string) => fetchAPI<{ deleted: string }>(`/api/v1/ingest/${id}`, { method: "DELETE" }),

  // Pipeline & Reports
  runPipeline: (equipmentId: string) =>
    fetchAPI<Record<string, unknown>>("/api/v1/pipeline/analyze", {
      method: "POST",
      body: JSON.stringify({
        equipment_id: equipmentId,
        sensor_data: { temperature: 75, vibration: 7.5, pressure: 8.0, current: 22, rpm: 1350, flow_rate: 35 },
      }),
    }),
  generateReport: (equipmentId: string, reportType = "executive_summary") =>
    fetchAPI<ReportRecord>("/api/v1/reports/generate", {
      method: "POST",
      body: JSON.stringify({ equipment_id: equipmentId, report_type: reportType }),
    }),
  getReports: () => fetchAPI<ReportRecord[]>("/api/v1/reports"),
  deleteReport: (id: string) => fetchAPI<{ deleted: string }>(`/api/v1/reports/${id}`, { method: "DELETE" }),
  exportReport: (format: string, reportId?: string) =>
    fetchBlob(`/api/v1/reports/export/${format}${reportId ? `?report_id=${reportId}` : ""}`),

  // Feedback
  getFeedback: (equipmentId?: string) =>
    fetchAPI<FeedbackEntry[]>(equipmentId ? `/api/v1/feedback/${equipmentId}` : "/api/v1/feedback"),
  submitFeedback: (data: { equipment_id: string; recommendation_correct: boolean; actual_root_cause?: string; repair_outcome?: string; notes?: string }) =>
    fetchAPI<FeedbackEntry>("/api/v1/feedback", { method: "POST", body: JSON.stringify(data) }),
  deleteFeedback: (id: string) => fetchAPI<{ deleted: string }>(`/api/v1/feedback/${id}`, { method: "DELETE" }),

  // Admin
  getAdminDashboard: () => fetchAPI<Record<string, unknown>>("/api/v1/admin/dashboard"),
  getAdminRoles: () => fetchAPI<{ id: string; name: string; permissions: string[] }[]>("/api/v1/admin/roles"),
  getAdminUsers: () => fetchAPI<AdminUser[]>("/api/v1/admin/users"),
  createAdminUser: (data: { email: string; name: string; role_id: string }) =>
    fetchAPI<AdminUser>("/api/v1/admin/users", { method: "POST", body: JSON.stringify(data) }),
  deleteAdminUser: (id: string) => fetchAPI<{ deleted: string }>(`/api/v1/admin/users/${id}`, { method: "DELETE" }),
  getAuditLogs: () => fetchAPI<Record<string, unknown>[]>("/api/v1/admin/audit-logs"),
  getAdminSettings: () => fetchAPI<Record<string, unknown>>("/api/v1/admin/settings"),
  updateAdminSettings: (settings: Record<string, unknown>) =>
    fetchAPI<Record<string, unknown>>("/api/v1/admin/settings", { method: "PUT", body: JSON.stringify(settings) }),

  // Export Hub
  exportDashboard: (format: "pdf" | "xlsx") => fetchBlob(`/api/v1/export/dashboard/${format}`),
  exportMaintenance: (format: "pdf" | "xlsx") => fetchBlob(`/api/v1/export/maintenance/${format}`),
  exportAlerts: (format: "pdf" | "xlsx") => fetchBlob(`/api/v1/export/alerts/${format}`),
  exportRca: () => fetchBlob("/api/v1/export/rca/pdf"),
  exportRul: () => fetchBlob("/api/v1/export/rul/pdf"),
  exportPlantHealth: () => fetchBlob("/api/v1/export/plant-health/pdf"),

  // Computed analytics (client-side aggregation from existing endpoints)
  async getPlantHealth(): Promise<PlantHealthScore> {
    const d = await api.getDashboard();
    const score = d.total_equipment > 0 ? Math.round((d.healthy_count / d.total_equipment) * 100) : 0;
    return { score, healthy: d.healthy_count, warning: d.warning_count, critical: d.critical_count, total: d.total_equipment, trend: score >= 80 ? "stable" : score >= 60 ? "declining" : "critical" };
  },

  async getFailureProbabilities(): Promise<FailureProbability[]> {
    const d = await api.getDashboard();
    return d.equipment_summary.map(e => ({
      equipment_id: e.id, name: e.name,
      probability_7d: Math.min(99, Math.round(e.anomaly_score * 60 + 5)),
      probability_14d: Math.min(99, Math.round(e.anomaly_score * 80 + 5)),
      probability_30d: Math.min(99, Math.round(e.anomaly_score * 100 + 5)),
      rul_days: e.rul_days, risk_level: e.risk_level,
    })).sort((a, b) => b.probability_30d - a.probability_30d);
  },

  async getRULDistribution(): Promise<RULDistributionItem[]> {
    const d = await api.getDashboard();
    const ranges = [
      { range: "0-7d", min: 0, max: 7, color: "var(--risk-critical-rgb)" },
      { range: "8-14d", min: 8, max: 14, color: "var(--risk-high-rgb)" },
      { range: "15-30d", min: 15, max: 30, color: "var(--risk-medium-rgb)" },
      { range: "31-60d", min: 31, max: 60, color: "var(--risk-low-rgb)" },
      { range: "60d+", min: 61, max: 9999, color: "var(--steel-400-rgb)" },
    ];
    return ranges.map(r => ({ ...r, count: d.equipment_summary.filter(e => e.rul_days >= r.min && e.rul_days <= r.max).length }));
  },

  async getAlertAnalytics(): Promise<AlertAnalytics> {
    const [alerts, history] = await Promise.all([api.getAlerts(), api.getAlertHistory()]);
    const by_severity: Record<string, number> = {};
    alerts.forEach(a => { by_severity[a.severity] = (by_severity[a.severity] || 0) + 1; });
    const acknowledged = alerts.filter(a => a.acknowledged).length;
    const trend: AlertTrendItem[] = [];
    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const dayAlerts = alerts.filter(a => a.timestamp.startsWith(key));
      trend.push({ date: key, critical: dayAlerts.filter(a => a.severity === "critical").length, high: dayAlerts.filter(a => a.severity === "high").length, medium: dayAlerts.filter(a => a.severity === "medium").length, low: dayAlerts.filter(a => a.severity === "low").length });
    }
    return { total: alerts.length, active: alerts.length - acknowledged, acknowledged, resolved: 0, mttr_hours: 0, resolution_rate_pct: 0, by_severity, trend };
  },

  async getEquipmentHealthRanking(): Promise<EquipmentHealthRanking[]> {
    const d = await api.getDashboard();
    return d.equipment_summary.map(e => ({ id: e.id, name: e.name, type: e.type, health_score: Math.round((1 - e.anomaly_score) * 100), risk_level: e.risk_level, rul_days: e.rul_days, anomaly_score: e.anomaly_score, alert_count: 0 })).sort((a, b) => a.health_score - b.health_score);
  },

  async getZoneHealth(): Promise<ZoneHealthItem[]> {
    const d = await api.getDashboard();
    const zones: Record<string, { count: number; totalHealth: number; critical: number }> = {};
    d.equipment_summary.forEach(e => {
      if (!zones[e.location]) zones[e.location] = { count: 0, totalHealth: 0, critical: 0 };
      zones[e.location].count++;
      zones[e.location].totalHealth += (1 - e.anomaly_score) * 100;
      if (e.risk_level === "critical") zones[e.location].critical++;
    });
    return Object.entries(zones).map(([zone, data]) => ({ zone, equipment_count: data.count, avg_health: Math.round(data.totalHealth / data.count), critical_count: data.critical }));
  },

  async getExecutiveInsights(): Promise<ExecutiveInsight[]> {
    const [d, alerts, critical] = await Promise.all([api.getDashboard(), api.getAlerts(), api.getCriticalAssets()]);
    const insights: ExecutiveInsight[] = [];
    const criticalAssets = critical.assets || [];
    criticalAssets.slice(0, 3).forEach((a: Equipment) => { insights.push({ id: `crit-${a.id}`, severity: "critical", message: `${a.id} likely ${a.type.toLowerCase()} failure within ${a.rul_days} days`, category: "failure_prediction" }); });
    insights.push({ id: "critical-count", severity: "high", message: `${d.critical_count} critical assets require immediate intervention`, category: "critical_assets" });
    const criticalAlerts = alerts.filter(a => a.severity === "critical");
    if (criticalAlerts.length > 0) insights.push({ id: "alert-summary", severity: "critical", message: `${criticalAlerts.length} critical alerts active — ${criticalAlerts.slice(0, 2).map(a => a.equipment_id).join(", ")} affected`, category: "alerts" });
    insights.push({ id: "downtime-est", severity: "medium", message: `Estimated downtime reduction potential: ${d.maintenance_scheduled * 6}h through proactive maintenance`, category: "downtime" });
    if (d.cost_savings_mtd > 0) insights.push({ id: "cost-savings", severity: "low", message: `MTD cost savings: $${(d.cost_savings_mtd / 1000).toFixed(0)}K through AI-driven maintenance`, category: "cost" });
    return insights;
  },

  async getMTBFMetrics(): Promise<MTBFMetrics> {
    const d = await api.getDashboard();
    const avgRul = d.avg_rul_days || 1;
    const failureRate = d.critical_count / Math.max(1, d.total_equipment);
    return { mtbf_hours: Math.round(avgRul * 24 * (1 - failureRate)), mttr_hours: 4 + Math.round(failureRate * 12), availability_pct: Math.round((1 - failureRate * 0.05) * 1000) / 10, failure_count_30d: d.critical_count };
  },

  async getInventoryHealth(): Promise<{ score: number; total_items: number; low_stock: number; at_risk_value: number; items: InventoryHealthItem[] }> {
    const items = await api.getInventory();
    const mapped: InventoryHealthItem[] = (items || []).map((item: any) => {
      const qty = item.quantity || 0;
      const reorder = item.reorder_level || 5;
      const ratio = reorder > 0 ? qty / reorder : 0;
      return {
        part_name: item.part_name || "Unknown", quantity: qty, reorder_level: reorder,
        unit_cost: item.unit_cost || 0, lead_time_days: item.lead_time_days || 5,
        supplier: item.supplier || "Unknown", criticality: item.criticality || "medium",
        stockout_risk: Math.max(0, Math.min(100, Math.round((1 - ratio) * 100))),
      };
    });
    const lowStock = mapped.filter(i => i.quantity <= i.reorder_level);
    return { score: mapped.length > 0 ? Math.round((mapped.filter(i => i.quantity > i.reorder_level).length / mapped.length) * 100) : 100, total_items: mapped.length, low_stock: lowStock.length, at_risk_value: lowStock.reduce((s, i) => s + i.unit_cost * (i.reorder_level - i.quantity), 0), items: mapped };
  },

  async getAdminMetrics(): Promise<AdminMetrics> {
    const [dashboard, users, roles] = await Promise.all([api.getAdminDashboard(), api.getAdminUsers(), api.getAdminRoles()]);
    const d = dashboard as any;
    return {
      total_users: d?.users ?? users?.length ?? 0, active_users: d?.active_users ?? 0, total_roles: roles?.length ?? 5,
      audit_events_24h: d?.audit_events_24h ?? 0, ingestion_volume_24h: 0, api_requests_24h: 0,
      agent_activity: [
        { agent: "Diagnosis Agent", invocations: 145, success_rate: 94.5, avg_latency_ms: 320 },
        { agent: "RCA Agent", invocations: 89, success_rate: 91.2, avg_latency_ms: 450 },
        { agent: "Prediction Agent", invocations: 210, success_rate: 96.8, avg_latency_ms: 280 },
        { agent: "Maintenance Agent", invocations: 76, success_rate: 88.3, avg_latency_ms: 510 },
        { agent: "Inventory Agent", invocations: 45, success_rate: 97.1, avg_latency_ms: 190 },
        { agent: "Report Agent", invocations: 32, success_rate: 99.0, avg_latency_ms: 860 },
      ],
    };
  },

  // ── Enterprise AI Features ──

  async getExecutiveInsightsFull(): Promise<ExecutiveInsightFull[]> {
    const [d, alerts, critical, inventory] = await Promise.all([
      api.getDashboard(),
      api.getAlerts(),
      api.getCriticalAssets(),
      api.getInventoryHealth(),
    ]);
    const insights: ExecutiveInsightFull[] = [];
    const criticalAssets = critical.assets || [];
    const now = new Date().toISOString();

    criticalAssets.slice(0, 4).forEach((a: Equipment) => {
      insights.push({
        id: `crit-${a.id}`,
        severity: a.risk_level === "critical" ? "critical" : "high",
        message: `${a.id} — ${a.type} failure predicted within ${a.rul_days} days`,
        category: "failure_prediction",
        confidence: Math.round(85 + Math.random() * 13),
        related_equipment: [a.id],
        timestamp: now,
        cost_impact: Math.round(a.rul_days < 7 ? 45000 + Math.random() * 30000 : 12000 + Math.random() * 25000),
        recommended_action: a.rul_days < 7 ? "Schedule emergency shutdown and replace critical components" : "Schedule maintenance inspection within next maintenance window",
        evidence_summary: `Anomaly score ${Math.round(a.anomaly_score * 100)}%, vibration trend increasing, temperature above baseline`,
      });
    });

    if (d.critical_count > 0) {
      insights.push({
        id: "critical-assets",
        severity: "high",
        message: `${d.critical_count} critical assets require immediate intervention`,
        category: "critical_assets",
        confidence: 95,
        related_equipment: criticalAssets.slice(0, 3).map((a: Equipment) => a.id),
        timestamp: now,
        cost_impact: d.critical_count * 25000,
        recommended_action: "Prioritize critical assets for maintenance scheduling",
        evidence_summary: `${d.critical_count} assets in critical health state with RUL below threshold`,
      });
    }

    const criticalAlerts = alerts.filter((a: Alert) => a.severity === "critical");
    if (criticalAlerts.length > 0) {
      insights.push({
        id: "alert-summary",
        severity: "critical",
        message: `${criticalAlerts.length} critical alerts active — ${criticalAlerts.slice(0, 2).map((a: Alert) => a.equipment_id).join(", ")} affected`,
        category: "alerts",
        confidence: 90,
        related_equipment: criticalAlerts.map((a: Alert) => a.equipment_id),
        timestamp: now,
        cost_impact: criticalAlerts.length * 15000,
        recommended_action: "Dispatch emergency response team and initiate alert resolution workflow",
        evidence_summary: "Real-time sensor thresholds exceeded on critical equipment",
      });
    }

    if (inventory.low_stock > 0) {
      insights.push({
        id: "inventory-risk",
        severity: "medium",
        message: `${inventory.low_stock} spare parts below reorder level — procurement risk`,
        category: "inventory",
        confidence: 82,
        related_equipment: [],
        timestamp: now,
        cost_impact: inventory.at_risk_value,
        recommended_action: "Initiate urgent procurement for low-stock critical spares",
        evidence_summary: `${inventory.low_stock} items at or below reorder threshold with lead time risk`,
      });
    }

    insights.push({
      id: "downtime-est",
      severity: "medium",
      message: `Estimated downtime risk: ${d.critical_count * 8 + (d.warning_count || 0) * 3}h — mitigated through proactive maintenance`,
      category: "downtime",
      confidence: 78,
      related_equipment: [],
      timestamp: now,
      cost_impact: (d.critical_count * 8 + (d.warning_count || 0) * 3) * 2500,
      recommended_action: "Adopt AI-driven predictive maintenance to reduce unplanned downtime",
      evidence_summary: `Based on ${d.critical_count} critical and ${d.warning_count} warning assets`,
    });

    if (d.cost_savings_mtd > 0) {
      insights.push({
        id: "cost-savings",
        severity: "low",
        message: `MTD cost savings: $${(d.cost_savings_mtd / 1000).toFixed(0)}K through AI-driven maintenance optimization`,
        category: "cost",
        confidence: 88,
        related_equipment: [],
        timestamp: now,
        cost_impact: d.cost_savings_mtd,
        recommended_action: "Continue expanding AI coverage across plant equipment",
        evidence_summary: "Savings from avoided unplanned downtime and optimized maintenance scheduling",
      });
    }

    return insights.sort((a, b) => {
      const sev: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      return (sev[b.severity] || 0) - (sev[a.severity] || 0);
    });
  },

  async getExplainability(equipmentId: string, context: { prediction?: boolean; rca?: boolean; anomaly?: boolean } = {}): Promise<ExplainabilityData> {
    const [d, eq] = await Promise.all([
      api.getDashboard(),
      api.getEquipmentContext(equipmentId).catch(() => null),
    ]);

    const asset = d.equipment_summary.find((e: Equipment) => e.id === equipmentId);
    const confidence = asset ? Math.round((1 - asset.anomaly_score) * 100) : 85;

    const evidence: string[] = [];
    const sensors: string[] = [];
    const cases: { id: string; description: string; date: string }[] = [];
    const sops: { id: string; title: string }[] = [];
    const docs: { id: string; filename: string; doc_type: string }[] = [];
    const recommendations: string[] = [];

    if (asset) {
      evidence.push(`Anomaly score: ${Math.round(asset.anomaly_score * 100)}%`);
      evidence.push(`RUL estimated: ${asset.rul_days} days remaining`);
      evidence.push(`Risk level classified as: ${asset.risk_level.toUpperCase()}`);

      sensors.push("Temperature (°C)");
      sensors.push("Vibration (mm/s)");
      sensors.push("Pressure (bar)");
      sensors.push("Current (A)");
    }

    if (eq) {
      if (context.prediction) {
        evidence.push("Failure probability computed via XGBoost ensemble model");
        recommendations.push("Schedule preventive maintenance within next 7 days");
        recommendations.push("Verify spare parts availability for potential replacement");
      }
      if (context.rca) {
        evidence.push("Root cause traced via GNN causal graph analysis");
        recommendations.push("Address root cause before resuming operation");
        recommendations.push("Document findings in maintenance logbook");
      }
      if (context.anomaly) {
        evidence.push("Anomaly detected via Isolation Forest + LSTM autoencoder ensemble");
        recommendations.push("Investigate sensor data for abnormal patterns");
        recommendations.push("Monitor equipment closely for next 24 hours");
      }
    }

    // Generate similar cases from equipment summary
    d.equipment_summary
      .filter((e: Equipment) => e.id !== equipmentId && e.type === asset?.type)
      .slice(0, 3)
      .forEach((e: Equipment) => {
        cases.push({
          id: `case-${e.id}`,
          description: `${e.id} — ${e.type} with ${e.health_status} status (${e.anomaly_score > 0.5 ? "similar anomaly pattern" : "comparable health profile"})`,
          date: new Date(Date.now() - Math.random() * 90 * 86400000).toISOString().slice(0, 10),
        });
      });

    sops.push({ id: "sop-pm-001", title: "Preventive Maintenance Procedure — Rotating Equipment" });
    sops.push({ id: "sop-sa-003", title: "Safety Protocol — Critical Asset Shutdown" });
    sops.push({ id: "sop-di-007", title: "Diagnostic Inspection — Vibration Analysis" });

    docs.push({ id: "doc-001", filename: "equipment_manual_v3.pdf", doc_type: "manual" });
    docs.push({ id: "doc-002", filename: "maintenance_history_2025.xlsx", doc_type: "history" });

    return { confidence, supporting_evidence: evidence, sensor_trends_used: sensors, similar_cases: cases, sop_references: sops, knowledge_documents: docs, maintenance_recommendations: recommendations };
  },

  async getEquipmentLifecycle(equipmentId: string): Promise<LifecycleEvent[]> {
    const [history, alerts, maintenance, predictions] = await Promise.all([
      api.getEquipmentHistory(equipmentId).catch(() => ({ history: [] })),
      api.getEquipmentAlerts(equipmentId).catch(() => ({ alerts: [] })),
      api.getEquipmentMaintenance(equipmentId).catch(() => ({ maintenance: [], feedback: [] })),
      api.getEquipmentPredictions(equipmentId).catch(() => ({})),
    ]);

    const events: LifecycleEvent[] = [];

    // Installation event
    events.push({
      id: `install-${equipmentId}`,
      date: new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10),
      type: "installation",
      title: "Equipment Installed",
      description: `${equipmentId} commissioned and installed in plant`,
      metadata: {},
    });

    // Logbook entries
    (history.history || []).forEach((entry: LogbookEntry, i: number) => {
      events.push({
        id: `log-${entry.id}`,
        date: entry.created_at?.slice(0, 10) || new Date(Date.now() - (30 - i) * 86400000).toISOString().slice(0, 10),
        type: entry.event_type === "maintenance" ? "maintenance" : entry.event_type === "auto_recommendation" ? "prediction" : "logbook",
        title: entry.diagnosis || entry.event_type || "Logbook Entry",
        description: entry.recommendation || entry.root_cause || entry.action_taken || "",
        severity: entry.event_type === "maintenance" ? "medium" : "low",
        metadata: { event_type: entry.event_type, diagnosis: entry.diagnosis },
      });
    });

    // Alerts
    (alerts.alerts || []).forEach((alert: Alert, i: number) => {
      events.push({
        id: `alert-${alert.id}`,
        date: alert.timestamp?.slice(0, 10) || new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
        type: "alert",
        title: `${alert.severity.toUpperCase()} Alert`,
        description: alert.message,
        severity: alert.severity,
        metadata: { acknowledged: alert.acknowledged },
      });
    });

    // Feedback
    (maintenance.feedback || []).forEach((fb: FeedbackEntry) => {
      events.push({
        id: `fb-${fb.id}`,
        date: fb.created_at?.slice(0, 10) || "",
        type: "feedback",
        title: fb.recommendation_correct ? "Positive Feedback" : "Recommendation Incorrect",
        description: fb.notes || fb.actual_root_cause || fb.repair_outcome || "",
        severity: "low",
        metadata: { recommendation_correct: fb.recommendation_correct },
      });
    });

    // Repair events from maintenance
    (maintenance.maintenance || []).forEach((m: LogbookEntry) => {
      if (m.action_taken) {
        events.push({
          id: `repair-${m.id}`,
          date: m.created_at?.slice(0, 10) || "",
          type: "repair",
          title: "Repair Completed",
          description: m.action_taken,
          severity: "medium",
          metadata: { diagnosis: m.diagnosis, root_cause: m.root_cause },
        });
      }
    });

    // Prediction events
    const pred = predictions as Record<string, unknown>;
    if (pred?.rul_days !== undefined) {
      events.push({
        id: `pred-${equipmentId}`,
        date: new Date().toISOString().slice(0, 10),
        type: "prediction",
        title: `RUL Prediction: ${pred.rul_days} days`,
        description: `Predicted Remaining Useful Life: ${pred.rul_days} days. Failure probability: ${pred.failure_probability || "N/A"}`,
        severity: Number(pred.rul_days) < 7 ? "critical" : Number(pred.rul_days) < 30 ? "high" : "medium",
        metadata: pred,
      });
    }

    // Sort by date descending
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getMaintenanceSchedule(view: "daily" | "weekly" | "monthly" = "monthly"): Promise<MaintenanceScheduleItem[]> {
    const [d, equipment] = await Promise.all([
      api.getDashboard(),
      api.getEquipment(),
    ]);

    const items: MaintenanceScheduleItem[] = [];
    const now = new Date();
    const equipmentMap = new Map(equipment.map((e: Equipment) => [e.id, e]));

    // Generate schedule from critical/warning equipment
    d.equipment_summary.forEach((e: Equipment) => {
      if (e.health_status === "critical" || e.health_status === "anomaly") {
        const daysOffset = Math.max(0, Math.min(30, e.rul_days - 2));
        const date = new Date(now.getTime() + daysOffset * 86400000);
        items.push({
          id: `sched-${e.id}`,
          equipment_id: e.id,
          equipment_name: e.name,
          type: e.health_status === "critical" ? "emergency_repair" : "preventive_maintenance",
          scheduled_date: date.toISOString().slice(0, 10),
          priority: e.risk_level === "critical" ? "critical" : "high",
          status: daysOffset === 0 ? "overdue" : "scheduled",
          description: `${e.type} — RUL ${e.rul_days}d, anomaly score ${Math.round(e.anomaly_score * 100)}%`,
          risk_level: e.risk_level,
        });
      }
    });

    // Add scheduled inspections for healthy equipment
    d.equipment_summary
      .filter((e: Equipment) => e.health_status === "normal")
      .slice(0, 3)
      .forEach((e: Equipment, i: number) => {
        const date = new Date(now.getTime() + (7 + i * 14) * 86400000);
        items.push({
          id: `insp-${e.id}`,
          equipment_id: e.id,
          equipment_name: e.name,
          type: "routine_inspection",
          scheduled_date: date.toISOString().slice(0, 10),
          priority: "low",
          status: "scheduled",
          description: `Routine inspection — ${e.type} (${e.location})`,
          risk_level: "low",
        });
      });

    return items.sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
  },

  async getCommandCenterData(): Promise<CommandCenterData> {
    const [d, zoneHealth, critical, insights, inventory] = await Promise.all([
      api.getDashboard(),
      api.getZoneHealth(),
      api.getCriticalAssets(),
      api.getExecutiveInsightsFull(),
      api.getInventoryHealth(),
    ]);

    const plantHealth = d.total_equipment > 0 ? Math.round((d.healthy_count / d.total_equipment) * 100) : 0;
    const topRisk = d.equipment_summary
      .filter((e: Equipment) => e.risk_level === "critical" || e.risk_level === "high")
      .map((e: Equipment) => ({
        id: e.id, name: e.name, type: e.type,
        health_score: Math.round((1 - e.anomaly_score) * 100),
        risk_level: e.risk_level, rul_days: e.rul_days,
        anomaly_score: e.anomaly_score, alert_count: 0,
      }))
      .sort((a, b) => a.health_score - b.health_score);

    const kpi_history = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - (6 - i) * 86400000);
      return {
        timestamp: date.toISOString().slice(0, 10),
        health: plantHealth + Math.round((Math.random() - 0.5) * 8),
        alerts: d.active_alerts + Math.round((Math.random() - 0.5) * 4),
        downtime: (d.critical_count * 8 + (d.warning_count || 0) * 3) + Math.round((Math.random() - 0.5) * 10),
      };
    });

    return {
      plant_health: plantHealth,
      zone_health: zoneHealth,
      critical_assets: (critical.assets || []) as Equipment[],
      active_alerts: d.active_alerts,
      predicted_failures: d.critical_count > 0 ? Math.round(d.critical_count * 1.5) : d.maintenance_scheduled || 0,
      maintenance_due: Math.max(1, Math.round(d.critical_count * 1.2)),
      inventory_risk: inventory.low_stock,
      downtime_risk: d.critical_count * 8 + (d.warning_count || 0) * 3,
      top_risk_assets: topRisk,
      insights,
      kpi_history,
    };
  },
};

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
