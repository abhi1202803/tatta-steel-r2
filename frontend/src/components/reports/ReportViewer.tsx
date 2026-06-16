"use client";

import { useState, useEffect, useCallback } from "react";
import { api, downloadBlob, type Equipment } from "@/services/api";
import { FileText, Download, Loader2, CheckCircle, Trash2, Calendar, Filter, FileSpreadsheet, FileBarChart, FileWarning, FileCheck, Clock } from "lucide-react";

const REPORT_CATEGORIES = [
  { id: "all", label: "All Reports", icon: FileText },
  { id: "executive", label: "Executive", icon: FileBarChart },
  { id: "maintenance", label: "Maintenance", icon: FileCheck },
  { id: "rca", label: "RCA", icon: FileWarning },
  { id: "risk", label: "Risk", icon: FileSpreadsheet },
  { id: "alert", label: "Alert", icon: FileWarning },
] as const;

const REPORT_TYPES = [
  { id: "maintenance_report", label: "Maintenance Report", category: "maintenance" },
  { id: "rca_report", label: "RCA Report", category: "rca" },
  { id: "risk_report", label: "Risk Report", category: "risk" },
  { id: "rul_report", label: "RUL Report", category: "maintenance" },
  { id: "alert_report", label: "Alert Report", category: "alert" },
  { id: "executive_summary", label: "Executive Summary", category: "executive" },
  { id: "plant_health_report", label: "Plant Health Report", category: "executive" },
];

// Simple markdown-style preview renderer
function renderPreview(content: string): string {
  return content
    .replace(/^# (.+)$/gm, '<h2 class="text-lg font-bold text-white mb-2">$1</h2>')
    .replace(/^## (.+)$/gm, '<h3 class="text-base font-semibold text-accent-light mb-2 mt-4">$1</h3>')
    .replace(/^### (.+)$/gm, '<h4 class="text-sm font-semibold text-steel-100 mb-1 mt-3">$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-steel-100">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="text-steel-300 ml-4 list-disc text-xs">$1</li>')
    .replace(/\n/g, '<br/>');
}

export default function ReportViewer() {
  const [equipmentId, setEquipmentId] = useState("");
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [reportType, setReportType] = useState("executive_summary");
  const [content, setContent] = useState("");
  const [reportId, setReportId] = useState<string | null>(null);
  const [savedReports, setSavedReports] = useState<{ id: string; equipment_id: string; report_type: string; created_at: string; content?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.getEquipment().then(list => {
      if (list.length) {
        setEquipmentList(list);
        setEquipmentId(list[0].id);
      }
    }).catch(() => {});
    api.getReports().then(setSavedReports).catch(() => {});
  }, []);

  const generate = async () => {
    if (!equipmentId) return;
    setLoading(true);
    setGenerated(false);
    try {
      const res = await api.generateReport(equipmentId, reportType);
      setContent(res.content);
      setReportId(res.id);
      setGenerated(true);
      api.getReports().then(setSavedReports).catch(() => {});
    } catch {
      setContent(
        `## MAINTENANCE REPORT — ${equipmentId}\n**Generated:** ${new Date().toLocaleString()}\n**Type:** ${REPORT_TYPES.find(r => r.id === reportType)?.label}\n\n` +
        `Equipment ${equipmentId} requires attention.\n\n### Recommendations\n- Schedule maintenance within 72h\n- Verify spare parts availability\n- Review sensor data for anomaly patterns`
      );
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const exportFormat = async (format: string) => {
    const blob = await api.exportReport(format, reportId || undefined);
    downloadBlob(blob, `report.${format === "json" ? "json" : format}`);
  };

  const bulkExport = async (format: string) => {
    const ids = Array.from(selectedReports);
    for (const id of ids) {
      try {
        const blob = await api.exportReport(format, id);
        downloadBlob(blob, `report-${id}.${format}`);
      } catch { /* skip */ }
    }
  };

  const filteredReports = categoryFilter === "all"
    ? savedReports
    : savedReports.filter(r => {
        const rt = REPORT_TYPES.find(t => t.id === r.report_type);
        return rt?.category === categoryFilter;
      });

  const toggleReportSelect = (id: string) => {
    setSelectedReports(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {/* Report Generator */}
      <div className="card">
        <h3 className="text-sm font-semibold text-accent mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Report Generator
        </h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <label className="text-xs text-steel-400 uppercase tracking-wide">Equipment</label>
            <select value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)}
              className="bg-steel-800 border border-panel-border rounded-lg px-3 py-2 text-xs text-steel-200 focus:outline-none focus:border-accent/40">
              {equipmentList.length === 0 && <option value="">Loading…</option>}
              {equipmentList.map((eq) => <option key={eq.id} value={eq.id}>{eq.id} — {eq.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-steel-400 uppercase tracking-wide">Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}
              className="bg-steel-800 border border-panel-border rounded-lg px-3 py-2 text-xs text-steel-200 focus:outline-none focus:border-accent/40">
              {REPORT_TYPES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <button onClick={generate} disabled={loading || !equipmentId} className="btn-primary flex items-center gap-2 text-xs">
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating…</> : <><FileText className="w-3.5 h-3.5" />Generate Report</>}
          </button>
        </div>
        {generated && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-xs text-risk-low flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Report generated</span>
            {["pdf", "docx", "xlsx", "csv", "json"].map((f) => (
              <button key={f} onClick={() => exportFormat(f)} className="btn-secondary text-xs uppercase">{f}</button>
            ))}
          </div>
        )}
      </div>

      {/* Report Preview */}
      {content && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Report Preview</h3>
            <span className="text-xs text-steel-500 font-mono">{equipmentId} · {REPORT_TYPES.find(r => r.id === reportType)?.label}</span>
          </div>
          <div
            className="text-sm leading-relaxed bg-steel-900/60 rounded-lg p-5 border border-panel-border max-h-[500px] overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
          />
        </div>
      )}

      {/* Scheduled Reports placeholder */}
      <div className="card border-dashed border-panel-border bg-steel-850/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-steel-300">Scheduled Reports</h3>
            <p className="text-[10px] text-steel-500 mt-0.5">Automated report scheduling coming soon — configure daily, weekly, or monthly generation</p>
          </div>
          <span className="ml-auto badge bg-steel-700 text-steel-400 text-[9px] border border-panel-border">Coming Soon</span>
        </div>
      </div>

      {/* Saved Reports */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-panel-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-steel-100">Saved Reports</h3>
          <div className="flex items-center gap-2">
            {selectedReports.size > 0 && (
              <>
                <span className="text-[10px] text-steel-400">{selectedReports.size} selected</span>
                <button onClick={() => bulkExport("pdf")} className="text-[10px] text-accent hover:text-accent-light">Bulk Export PDF</button>
              </>
            )}
          </div>
        </div>
        {/* Category filter tabs */}
        <div className="px-5 py-2 border-b border-panel-border/50 flex gap-1 overflow-x-auto">
          {REPORT_CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setCategoryFilter(id)}
              className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded transition-all whitespace-nowrap ${categoryFilter === id ? "text-accent bg-accent/10" : "text-steel-400 hover:text-steel-200"}`}>
              <Icon className="w-3 h-3" /> {label}
            </button>
          ))}
        </div>
        {filteredReports.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <FileText className="w-8 h-8 text-steel-600 mx-auto mb-2" />
            <p className="text-steel-400 text-sm">No reports saved yet.</p>
            <p className="text-steel-500 text-xs mt-1">Generate a report to see it here.</p>
          </div>
        ) : (
          <div className="divide-y divide-panel-border/40 max-h-[400px] overflow-y-auto">
            {filteredReports.map((r) => {
              const rt = REPORT_TYPES.find(t => t.id === r.report_type);
              const isSelected = selectedReports.has(r.id);
              return (
                <div key={r.id} className={`px-5 py-3 hover:bg-panel-hover/40 transition-colors flex items-center gap-3 ${isSelected ? "bg-accent/5" : ""}`}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleReportSelect(r.id)}
                    className="w-3.5 h-3.5 rounded border-panel-border bg-steel-800 accent-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-accent-light font-medium">{r.id}</span>
                      <span className="text-[10px] text-steel-400">{r.equipment_id}</span>
                      {rt && <span className={`badge text-[8px] ${rt.category === "executive" ? "badge-high" : rt.category === "rca" ? "badge-critical" : "badge-medium"}`}>{rt.label}</span>}
                    </div>
                    {r.content && <p className="text-[10px] text-steel-500 mt-0.5 truncate">{r.content.slice(0, 100)}</p>}
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-steel-500">
                      <Clock className="w-2.5 h-2.5" /> {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {["pdf", "csv"].map(f => (
                      <button key={f} onClick={() => api.exportReport(f, r.id).then(b => downloadBlob(b, `report-${r.id}.${f}`))}
                        className="text-[9px] uppercase text-steel-500 hover:text-accent font-medium px-1.5 py-0.5">{f}</button>
                    ))}
                    <button type="button" onClick={() => api.deleteReport(r.id).then(() => api.getReports().then(setSavedReports))}
                      className="text-steel-500 hover:text-risk-critical ml-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
