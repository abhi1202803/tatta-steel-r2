"use client";

import { useState } from "react";
import { api, downloadBlob } from "@/services/api";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";

const EXPORTS = [
  { category: "Dashboard", items: [
    { label: "Executive Dashboard PDF", fn: () => api.exportDashboard("pdf"), file: "dashboard.pdf" },
    { label: "Dashboard Data XLSX", fn: () => api.exportDashboard("xlsx"), file: "dashboard.xlsx" },
  ]},
  { category: "Maintenance", items: [
    { label: "Maintenance Report PDF", fn: () => api.exportMaintenance("pdf"), file: "maintenance.pdf" },
    { label: "Maintenance Records XLSX", fn: () => api.exportMaintenance("xlsx"), file: "maintenance.xlsx" },
  ]},
  { category: "Alerts", items: [
    { label: "Alert Report PDF", fn: () => api.exportAlerts("pdf"), file: "alerts.pdf" },
    { label: "Alert Data XLSX", fn: () => api.exportAlerts("xlsx"), file: "alerts.xlsx" },
  ]},
  { category: "Analysis", items: [
    { label: "RCA Report PDF", fn: () => api.exportRca(), file: "rca.pdf" },
    { label: "RUL Report PDF", fn: () => api.exportRul(), file: "rul.pdf" },
    { label: "Plant Health PDF", fn: () => api.exportPlantHealth(), file: "plant-health.pdf" },
  ]},
  { category: "Reports", items: [
    { label: "Reports Index XLSX", fn: () => api.exportReport("xlsx"), file: "reports.xlsx" },
    { label: "Reports Index CSV", fn: () => api.exportReport("csv"), file: "reports.csv" },
    { label: "Reports Index JSON", fn: () => api.exportReport("json"), file: "reports.json" },
  ]},
];

export default function ExportHubPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (key: string, fn: () => Promise<Blob>, filename: string) => {
    setLoading(key);
    try {
      const blob = await fn();
      downloadBlob(blob, filename);
    } catch {
      /* fallback silent */
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
            <Download className="w-4 h-4 text-accent" />
          </div>
          <h1 className="page-title">Export Hub</h1>
        </div>
        <p className="page-subtitle ml-11">
          Centralized export for dashboard, maintenance, alerts, RCA, RUL, and plant health data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXPORTS.map((group) => (
          <div key={group.category} className="card">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              {group.category}
            </h3>
            <div className="space-y-2">
              {group.items.map((item) => {
                const key = `${group.category}-${item.label}`;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={loading === key}
                    onClick={() => handleExport(key, item.fn, item.file)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-panel-border hover:border-accent/30 hover:bg-panel-hover transition-all text-left text-sm"
                  >
                    <span className="text-steel-200">{item.label}</span>
                    {loading === key
                      ? <Loader2 className="w-4 h-4 animate-spin text-accent" />
                      : <FileSpreadsheet className="w-4 h-4 text-steel-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
