"use client";

import { useEffect, useState } from "react";
import { api, downloadBlob, type LogbookEntry } from "@/services/api";
import { BookOpen, Download, Filter, Plus, Trash2 } from "lucide-react";
import { TimelineSkeleton, PageHeaderSkeleton } from "@/components/Skeletons";

const EVENT_COLORS: Record<string, string> = {
  diagnosis: "text-risk-high",
  maintenance: "text-accent",
  auto_recommendation: "text-risk-medium",
  alert: "text-risk-critical",
  feedback: "text-risk-low",
};

export default function LogbookPage() {
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.getLogbook(filter || undefined)
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const exportPdf = async () => {
    const blob = await api.exportLogbookPdf(filter || undefined);
    downloadBlob(blob, "logbook.pdf");
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-accent" />
          </div>
          <h1 className="page-title">Maintenance Logbook</h1>
        </div>
        <p className="page-subtitle ml-11">
          Digital logbook — auto entries from diagnosis, recommendations, repairs, alerts, and feedback
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-400" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by equipment ID..."
            className="input-field w-full pl-10"
          />
        </div>
        <button type="button" onClick={exportPdf} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" /> Export PDF
        </button>
        <button type="button" onClick={() => api.exportLogbookXlsx(filter || undefined).then((b) => downloadBlob(b, "logbook.xlsx"))} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" /> Export XLSX
        </button>
      </div>

      {loading ? (
        <TimelineSkeleton items={5} />
      ) : entries.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-10 h-10 text-steel-500 mx-auto mb-3" />
          <p className="text-steel-400">No logbook entries yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="card-hover flex gap-4">
              <div className="w-1 rounded-full bg-accent/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-accent-light">{entry.equipment_id}</span>
                    <span className={`text-[10px] uppercase font-bold ${EVENT_COLORS[entry.event_type] || "text-steel-400"}`}>
                      {entry.event_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-steel-500">{new Date(entry.created_at).toLocaleString()}</span>
                    <button type="button" onClick={() => api.deleteLogbookEntry(entry.id).then(load)} className="text-steel-500 hover:text-risk-critical" aria-label={`Delete logbook entry ${entry.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {entry.diagnosis && <p className="text-sm text-steel-200 mb-1"><span className="text-steel-500">Diagnosis:</span> {entry.diagnosis}</p>}
                {entry.recommendation && <p className="text-sm text-steel-200 mb-1"><span className="text-steel-500">Recommendation:</span> {entry.recommendation}</p>}
                {entry.root_cause && <p className="text-sm text-steel-300"><span className="text-steel-500">Root Cause:</span> {entry.root_cause}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
