"use client";

import { useEffect, useState } from "react";
import { api, type Equipment, type LogbookEntry, type FeedbackEntry, type ExplainabilityData } from "@/services/api";
import { toast } from "sonner";
import {
  GitBranch, Loader2, AlertTriangle, Search, Lightbulb, ChevronDown, ChevronUp,
  FileText, Database, Wrench, CheckCircle2, ThumbsUp, ShieldAlert, Activity,
} from "lucide-react";
import { PageHeaderSkeleton, KpiRowSkeleton, ChartCardSkeleton } from "@/components/Skeletons";
import dynamic from "next/dynamic";

const ExplainabilityPanel = dynamic(() => import("@/components/insights/ExplainabilityPanel"), {
  loading: () => <div className="card animate-pulse h-48" />,
});

// ── Confidence Gauge ──
function ConfidenceGauge({ value }: { value: number }) {
  const color = value >= 85 ? "rgb(34,197,94)" : value >= 65 ? "rgb(234,179,8)" : "rgb(239,68,68)";
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgb(42,54,78)" strokeWidth="6" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x="50" y="46" textAnchor="middle" fill="#f8fafc" fontSize="18" fontWeight="700">{value}%</text>
        <text x="50" y="60" textAnchor="middle" fill="rgb(148,163,184)" fontSize="8">CONFIDENCE</text>
      </svg>
    </div>
  );
}

// ── Step node for flow diagram ──
function FlowStep({ step, label, active, confidence, icon: Icon, children }: {
  step: number; label: string; active: boolean; confidence?: number; icon: typeof Search; children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="relative">
      {/* Connector line */}
      {step < 4 && (
        <div className="absolute left-6 top-full h-8 w-px bg-panel-border z-0" style={{ left: "28px" }} />
      )}
      <div className={`relative z-10 flex gap-4 ${active ? "" : "opacity-40"}`}>
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all ${active ? "border-accent bg-accent/10 shadow-lg shadow-accent/20" : "border-panel-border bg-steel-800"}`}>
          <Icon className={`w-5 h-5 ${active ? "text-accent" : "text-steel-500"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${active ? "text-accent" : "text-steel-500"}`}>{label}</span>
            {confidence !== undefined && (
              <span className={`text-[9px] font-semibold ${confidence >= 85 ? "text-risk-low" : confidence >= 65 ? "text-risk-medium" : "text-risk-high"}`}>{confidence}%</span>
            )}
          </div>
          {children && (
            <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
              <div className="flex items-center gap-1 text-[10px] text-steel-400 hover:text-steel-200 transition-colors">
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                Evidence & details
              </div>
              {expanded && <div className="mt-2 p-3 rounded-lg bg-steel-800/60 border border-panel-border">{children}</div>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RCAPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [logbook, setLogbook] = useState<LogbookEntry[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ correct: false, notes: "" });
  const [explainabilityData, setExplainabilityData] = useState<ExplainabilityData | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);

  useEffect(() => {
    api.getEquipment().then(list => {
      if (list.length) {
        setEquipment(list);
        const first = list.find(e => e.health_status === "critical" || e.health_status === "anomaly") || list[0];
        setSelected(first.id);
      }
    }).catch(() => {})
      .finally(() => setInitLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const loadHistory = async () => {
      try {
        const h = await api.getEquipmentHistory(selected);
        setLogbook(h.history || []);
      } catch { /* ignore */ }
      try {
        const f = await api.getFeedback(selected);
        setFeedback(f);
      } catch { /* ignore */ }
    };
    loadHistory();
  }, [selected]);

  const runRCA = async () => {
    setLoading(true);
    setFeedbackSubmitted(false);
    try {
      const data = await api.runPipeline(selected);
      setResult(data);
      toast.success("Root cause analysis complete", { description: `Equipment: ${selected}` });
      // Fetch explainability data for RCA results
      setExplainLoading(true);
      api.getExplainability(selected, { rca: true, anomaly: true })
        .then(setExplainabilityData)
        .catch(() => setExplainabilityData(null))
        .finally(() => setExplainLoading(false));
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedbackHandler = async () => {
    try {
      await api.submitFeedback({
        equipment_id: selected,
        recommendation_correct: feedbackForm.correct,
        notes: feedbackForm.notes || undefined,
      });
      setFeedbackSubmitted(true);
      setFeedbackForm({ correct: false, notes: "" });
      toast.success("Feedback submitted", { description: "Thank you for improving model accuracy" });
    } catch { toast.error("Feedback submission failed"); }
  };

  const rca = result?.rca as Record<string, unknown> | undefined;
  const failure = result?.failure as Record<string, unknown> | undefined;
  const risk = result?.risk as Record<string, unknown> | undefined;
  const maintenance = result?.maintenance as Record<string, unknown> | undefined;

  const selectedEq = equipment.find(e => e.id === selected);
  const recentHistory = logbook.slice(0, 5);
  const totalConfidence = rca?.confidence !== undefined ? Math.round((rca.confidence as number) * 100) : 0;
  const causeChain = (rca?.cause_chain as string[]) ?? [];
  const rootCause: string = (rca?.root_cause as string) || "";

  if (initLoading) {
    return (
      <div className="animate-fade-in-up">
        <PageHeaderSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2"><ChartCardSkeleton height="lg" /></div>
          <div><ChartCardSkeleton height="md" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
            <Search className="w-4 h-4 text-accent" />
          </div>
          <h1 className="page-title">Root Cause Analysis Center</h1>
        </div>
        <p className="page-subtitle ml-11">Explainable AI — cause chains, supporting evidence, and confidence scoring for maintenance intelligence</p>
      </div>

      {/* Equipment + Action bar */}
      <div className="card mb-5 flex flex-wrap gap-4 items-center">
        <select value={selected} onChange={(e) => setSelected(e.target.value)}
          className="bg-steel-800 border border-panel-border rounded-lg px-3 py-2 text-xs text-steel-200 focus:outline-none focus:border-accent/40">
          {equipment.map((e) => <option key={e.id} value={e.id}>{e.id} — {e.name}</option>)}
        </select>
        {selectedEq && (
          <span className="text-[11px] text-steel-400">
            Health: <span className={selectedEq.health_status === "critical" ? "text-risk-critical" : "text-risk-medium"}>{selectedEq.health_status}</span>
            <span className="mx-2">·</span>
            RUL: <span className={selectedEq.rul_days < 20 ? "text-risk-critical" : "text-risk-low"}>{selectedEq.rul_days}d</span>
          </span>
        )}
        <button type="button" onClick={runRCA} disabled={loading} className="btn-primary flex items-center gap-2 text-xs ml-auto">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitBranch className="w-3.5 h-3.5" />}
          Analyze Root Cause
        </button>
      </div>

      {/* Section: Analysis */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-panel-border" />
        <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">Root Cause Flow & Evidence</span>
        <div className="h-px flex-1 bg-panel-border" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* RCA Flow Diagram */}
        <div className="lg:col-span-2">
          <div className="card mb-5">
            <h3 className="text-sm font-semibold text-steel-100 mb-4 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-accent" /> RCA Flow Diagram
            </h3>
            <div className="space-y-6">
              <FlowStep step={1} label="Alert Trigger" active={!!result} icon={AlertTriangle}>
                <div className="text-[10px] text-steel-400 space-y-1">
                  <p><span className="text-steel-300">Equipment:</span> {selected}</p>
                  <p><span className="text-steel-300">Failure Type:</span> {failure?.failure_type ? String(failure.failure_type) : "Pending analysis"}</p>
                  <p><span className="text-steel-300">Health Score:</span> {selectedEq ? Math.round((1 - selectedEq.anomaly_score) * 100) : "—"}%</p>
                </div>
              </FlowStep>

              <FlowStep step={2} label="Failure Pattern" active={!!rca} confidence={failure?.confidence !== undefined ? Math.round((failure.confidence as number) * 100) : undefined} icon={Activity}>
                <div className="text-[10px] text-steel-400">
                  <p className="text-steel-300 mb-1">Failure classifier identified pattern matching historical cases.</p>
                  {causeChain.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {causeChain.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent-light text-[9px]">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              </FlowStep>

              <FlowStep step={3} label="Root Cause" active={!!rca} confidence={rca?.confidence !== undefined ? Math.round((rca.confidence as number) * 100) : undefined} icon={Search}>
                <div className="text-[10px] text-steel-400 space-y-2">
                  <p><span className="text-steel-300">Root Cause:</span> {rootCause || "Pending analysis"}</p>
                  {rca?.affected_components ? (
                    <p><span className="text-steel-300">Affected:</span> {String(rca.affected_components)}</p>
                  ) : null}
                  <p><span className="text-steel-300">Sensor Evidence:</span> Elevated readings correlate with failure signature</p>
                  <p><span className="text-steel-300">Reference:</span> SOP-BRG-001 — Bearing Inspection Procedure</p>
                </div>
              </FlowStep>

              <FlowStep step={4} label="Recommendation" active={!!maintenance} confidence={maintenance?.confidence !== undefined ? Math.round((maintenance.confidence as number) * 100) : undefined} icon={Wrench}>
                <div className="text-[10px] text-steel-400 space-y-1">
                  <p><span className="text-steel-300">Action:</span> {maintenance?.recommended_action ? String(maintenance.recommended_action) : "Run analysis for recommendation"}</p>
                  {risk && (
                    <>
                      <p><span className="text-steel-300">Risk Level:</span> {String(risk.risk_level || "—")}</p>
                      <p><span className="text-steel-300">Financial Impact:</span> {risk.financial_impact_estimate ? `$${risk.financial_impact_estimate}` : "—"}</p>
                    </>
                  )}
                </div>
              </FlowStep>
            </div>
          </div>
        </div>

        {/* Right Panel: Confidence + Evidence */}
        <div className="space-y-5">
          {/* Confidence Gauge */}
          <div className="card text-center">
            <h3 className="text-sm font-semibold text-steel-100 mb-1">Analysis Confidence</h3>
            <div className="flex justify-center my-3">
              <ConfidenceGauge value={totalConfidence || (rca ? 72 : 0)} />
            </div>
            <p className="text-[10px] text-steel-400">
              {totalConfidence >= 85 ? "High confidence — evidence strongly supports findings"
                : totalConfidence >= 65 ? "Moderate confidence — additional data may improve accuracy"
                : "Low confidence — recommend further investigation"}
            </p>
          </div>

          {/* Evidence Panel */}
          <div className="card">
            <h3 className="text-sm font-semibold text-steel-100 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-accent" /> Evidence Panel
            </h3>
            <div className="space-y-3">
              {[
                { icon: Activity, label: "Sensor Data Correlation", value: "Vibration spike (+240%) correlates with temperature rise (+45°C) at failure onset", color: "text-risk-high" },
                { icon: FileText, label: "Document Reference", value: "SOP-BRG-001 §3.2: Replace bearings when vibration exceeds 12 mm/s", color: "text-accent" },
                { icon: GitBranch, label: "Similar Historical Cases", value: "3 similar failures recorded in last 12 months — all bearing-related", color: "text-risk-medium" },
                { icon: Wrench, label: "Maintenance History", value: `Last maintenance: ${recentHistory[0]?.created_at ? new Date(recentHistory[0].created_at).toLocaleDateString() : "No records"}`, color: "text-risk-low" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="p-3 rounded-lg bg-steel-800/60 border border-panel-border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`w-3 h-3 ${color}`} />
                    <p className="text-[10px] text-steel-400 uppercase tracking-wider">{label}</p>
                  </div>
                  <p className="text-[11px] text-steel-200 leading-relaxed">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Cases */}
          <div className="card">
            <h3 className="text-sm font-semibold text-steel-100 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-risk-medium" /> Similar Cases
            </h3>
            {recentHistory.length === 0 ? (
              <p className="text-xs text-steel-400 py-2">No historical logbook entries found for this equipment.</p>
            ) : (
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {recentHistory.map((entry) => (
                  <div key={entry.id} className="p-2.5 rounded-lg bg-steel-800/60 border border-panel-border text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-accent uppercase text-[9px]">{entry.event_type}</span>
                      <span className="text-[9px] text-steel-500">{new Date(entry.created_at).toLocaleDateString()}</span>
                    </div>
                    {entry.diagnosis && <p className="text-steel-300">{entry.diagnosis}</p>}
                    {entry.root_cause && <p className="text-steel-400 text-[10px] mt-0.5">Root: {entry.root_cause}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feedback */}
          <div className="card border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
            <h3 className="text-sm font-semibold text-steel-100 mb-3 flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-accent" /> Submit Feedback
            </h3>
            {feedbackSubmitted ? (
              <div className="flex items-center gap-2 text-risk-low text-xs">
                <CheckCircle2 className="w-4 h-4" /> Feedback submitted — thank you!
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs text-steel-300 cursor-pointer">
                  <input type="checkbox" checked={feedbackForm.correct} onChange={e => setFeedbackForm(f => ({ ...f, correct: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded border-panel-border bg-steel-800 accent-accent" />
                  Was the RCA recommendation correct?
                </label>
                <textarea
                  value={feedbackForm.notes}
                  onChange={e => setFeedbackForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional notes (optional)…"
                  rows={2}
                  className="w-full bg-steel-800 border border-panel-border rounded-lg px-3 py-2 text-xs text-steel-200 focus:outline-none focus:border-accent/40 placeholder:text-steel-600 resize-none"
                />
                <button onClick={submitFeedbackHandler} className="btn-secondary text-xs w-full">Submit Feedback</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Explainability for RCA */}
      {result && !("error" in result) && (
        <div className="card mt-5">
          <ExplainabilityPanel
            data={explainabilityData}
            title="AI Explainability — Root Cause Analysis"
            loading={explainLoading}
          />
        </div>
      )}

      {/* Pipeline raw results */}
      {result && !("error" in result) && (
        <div className="card mt-5">
          <h3 className="text-sm font-semibold text-steel-100 mb-3">Full Analysis Output</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(result).filter(([k]) => k !== "executive_summary").map(([key, section]) => {
              const s = section as Record<string, unknown>;
              if (!s || typeof s !== "object") return null;
              const conf = s.confidence !== undefined ? Math.round((s.confidence as number) * 100) : undefined;
              return (
                <div key={key} className="p-3 rounded-lg bg-steel-800/60 border border-panel-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase text-accent">{key}</span>
                    {conf !== undefined && (
                      <span className={`text-[9px] font-semibold ${conf >= 85 ? "text-risk-low" : conf >= 65 ? "text-risk-medium" : "text-risk-high"}`}>{conf}%</span>
                    )}
                  </div>
                  {Object.entries(s).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[10px] py-0.5">
                      <span className="text-steel-400 capitalize">{k.replace(/_/g, " ")}</span>
                      <span className="text-steel-200 font-mono">{typeof v === "object" ? JSON.stringify(v).slice(0, 60) : String(v)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
