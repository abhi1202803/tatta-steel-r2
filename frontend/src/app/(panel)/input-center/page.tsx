"use client";

import { useState, useEffect, useRef } from "react";
import { api, type IngestRecord } from "@/services/api";
import { toast } from "sonner";
import {
  Upload, FileText, Activity, AlertTriangle, Clock, Package,
  FileWarning, Loader2, CheckCircle, Trash2, History,
} from "lucide-react";

const INPUT_TYPES = [
  { id: "sensor-data", label: "Sensor Data", icon: Activity, desc: "Temperature, vibration, pressure readings" },
  { id: "fault-log", label: "Fault Log", icon: AlertTriangle, desc: "Error codes and fault messages" },
  { id: "delay-log", label: "Delay Log", icon: Clock, desc: "Equipment delay and downtime records" },
  { id: "incident", label: "Incident", icon: FileWarning, desc: "Full incident reports" },
  { id: "failure-report", label: "Failure Report", icon: FileText, desc: "Post-failure analysis documents" },
  { id: "inventory", label: "Inventory", icon: Package, desc: "Spare parts and stock data" },
  { id: "manual", label: "Manual Entry", icon: FileText, desc: "Free-text maintenance notes" },
  { id: "sop", label: "SOP Document", icon: FileText, desc: "Standard operating procedures" },
];

export default function InputCenterPage() {
  const [selectedType, setSelectedType] = useState("sensor-data");
  const [equipmentId, setEquipmentId] = useState("BF-3");
  const [payload, setPayload] = useState('{"temperature": 85, "vibration": 6.2, "pressure": 7.5, "current": 20, "rpm": 1400}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<IngestRecord[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getIngestHistory().then(setHistory).catch(() => {});
  }, []);

  const submit = async () => {
    setLoading(true);
    setResult(null);
    try {
      let parsed: unknown;
      try { parsed = JSON.parse(payload); } catch { parsed = payload; }
      const res = await api.ingestTyped(selectedType, parsed, equipmentId);
      setResult(res);
      toast.success("Data ingested successfully", { description: `Type: ${selectedType}` });
      api.getIngestHistory().then(setHistory).catch(() => {});
    } catch (e) {
      setResult({ error: String(e) });
      toast.error("Ingestion failed", { description: String(e) });
    } finally {
      setLoading(false);
    }
  };

  const uploadPdf = async (file: File) => {
    setLoading(true);
    try {
      const res = await api.ingestPdf(file, equipmentId);
      setResult(res);
      toast.success("File uploaded", { description: file.name });
      api.getIngestHistory().then(setHistory).catch(() => {});
    } catch (e) {
      setResult({ error: String(e) });
      toast.error("File upload failed", { description: String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
            <Upload className="w-4 h-4 text-accent" />
          </div>
          <h1 className="page-title">Input Center</h1>
        </div>
        <p className="page-subtitle ml-11">
          Ingest sensor data, fault logs, incidents, SOPs, and inventory — routed through the Input Router Agent
        </p>
      </div>

      {/* Section: Configuration */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-panel-border" />
        <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">Data Ingestion</span>
        <div className="h-px flex-1 bg-panel-border" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input type selector */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs uppercase tracking-wider text-steel-400 font-semibold mb-3">Input Type</p>
          {INPUT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedType(t.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                selectedType === t.id
                  ? "border-accent/40 bg-accent/10"
                  : "border-panel-border hover:border-panel-border/80 hover:bg-panel-hover"
              }`}
            >
              <t.icon className={`w-4 h-4 mt-0.5 shrink-0 ${selectedType === t.id ? "text-accent" : "text-steel-400"}`} />
              <div>
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-[11px] text-steel-400 mt-0.5">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Input form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card space-y-4">
            <div>
              <label className="text-xs text-steel-400">Equipment ID</label>
              <input value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} className="input-field w-full mt-1" />
            </div>

            <div>
              <label className="text-xs text-steel-400">Payload (JSON or text)</label>
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="input-field w-full mt-1 h-36 font-mono text-xs resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={submit} disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Submit to Pipeline
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn-secondary flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Upload File (PDF/DOCX/CSV/XLSX)
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt,.csv,.xlsx,.json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadPdf(e.target.files[0])}
              />
            </div>
          </div>

          {result && (
            <div className="card border-risk-low/30">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-risk-low" />
                <h3 className="font-semibold text-sm">Routing & Pipeline Result</h3>
              </div>
              <pre className="text-xs text-steel-300 overflow-auto max-h-64 bg-steel-900/50 p-3 rounded-lg">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {/* Ingest history */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-sm">Ingest History</h3>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-4">
                <History className="w-6 h-6 text-steel-600 mx-auto mb-2" />
                <p className="text-sm text-steel-400">No ingest records yet</p>
                <p className="text-xs text-steel-500 mt-1">Submit data above to create your first record</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-2 rounded bg-steel-800/50 border border-panel-border text-xs">
                    <div>
                      <span className="font-mono text-accent-light">{h.id}</span>
                      <span className="mx-2 text-steel-500">·</span>
                      <span className="text-steel-300">{h.input_type}</span>
                      {h.equipment_id && <span className="ml-2 text-steel-400">{h.equipment_id}</span>}
                    </div>
                    <button type="button" onClick={() => api.deleteIngestRecord(h.id).then(() => api.getIngestHistory().then(setHistory))} className="text-steel-500 hover:text-risk-critical" aria-label={`Delete ingest record ${h.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
