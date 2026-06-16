"use client";

import { useEffect, useMemo, useState } from "react";
import { api, type FailureProbability, type RULDistributionItem, type EquipmentHealthRanking, type Equipment, type ExplainabilityData } from "@/services/api";
import { toast } from "sonner";
import {
  TrendingUp, Play, Loader2, Gauge, AlertTriangle, Clock, ChevronDown, ChevronUp, Target,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, Legend,
} from "recharts";
import { healthColor } from "@/utils/formatters";
import { KpiRowSkeleton, ChartCardSkeleton, TableSkeleton, PageHeaderSkeleton } from "@/components/Skeletons";
import dynamic from "next/dynamic";

const ExplainabilityPanel = dynamic(() => import("@/components/insights/ExplainabilityPanel"), {
  loading: () => <div className="card animate-pulse h-48" />,
});

const CHART_GRID = "rgb(42,54,78)";
const CHART_TEXT = "rgb(148,163,184)";
const RISK_COLORS: Record<string, string> = {
  low: "rgb(34,197,94)", medium: "rgb(234,179,8)", high: "rgb(249,115,22)", critical: "rgb(239,68,68)",
};

// ── Mini probability bar ──
function ProbBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 bg-steel-800 rounded-full overflow-hidden flex-1 min-w-[40px]">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  );
}

// ── Model confidence gauge ──
function ConfidenceBadge({ pct }: { pct: number }) {
  const c = pct >= 90 ? "text-risk-low bg-risk-low/10 border-risk-low/20" : pct >= 70 ? "text-risk-medium bg-risk-medium/10 border-risk-medium/20" : "text-risk-high bg-risk-high/10 border-risk-high/20";
  return <span className={`badge text-[9px] border ${c}`}>{pct}% conf.</span>;
}

export default function PredictivePage() {
  const [failureProbs, setFailureProbs] = useState<FailureProbability[]>([]);
  const [rulDist, setRulDist] = useState<RULDistributionItem[]>([]);
  const [healthRanking, setHealthRanking] = useState<EquipmentHealthRanking[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [sortField, setSortField] = useState<"prob" | "rul" | "health">("prob");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState("");
  const [pipelineResult, setPipelineResult] = useState<Record<string, unknown> | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [explainabilityData, setExplainabilityData] = useState<ExplainabilityData | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(["anomaly", "failure", "rca", "rul"]));

  useEffect(() => {
    Promise.all([
      api.getFailureProbabilities(),
      api.getRULDistribution(),
      api.getEquipmentHealthRanking(),
      api.getEquipment(),
    ]).then(([fp, rd, hr, eq]) => {
      setFailureProbs(fp);
      setRulDist(rd);
      setHealthRanking(hr);
      setEquipment(eq);
      if (fp.length) setSelected(fp[0].equipment_id);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Sorted ranking ──
  const sortedRanking = useMemo(() => {
    const arr = [...failureProbs];
    arr.sort((a, b) => {
      const cmp = sortField === "prob" ? b.probability_30d - a.probability_30d
        : sortField === "rul" ? a.rul_days - b.rul_days
        : (b as any).health_score - (a as any).health_score;
      return sortDir === "asc" ? -cmp : cmp;
    });
    return arr;
  }, [failureProbs, sortField, sortDir]);

  // ── Risk Matrix data (probability x consequence) ──
  const riskMatrixData = useMemo(() => {
    return failureProbs.map(fp => {
      const hr = healthRanking.find(h => h.id === fp.equipment_id);
      const consequence = hr ? (1 - hr.health_score / 100) * 100 : fp.probability_30d * 0.8;
      return {
        id: fp.equipment_id,
        name: fp.name,
        probability: fp.probability_30d,
        consequence: Math.round(consequence),
        risk_level: fp.risk_level,
        rul: fp.rul_days,
      };
    });
  }, [failureProbs, healthRanking]);

  // ── RUL ranking ──
  const rulRanking = useMemo(() => {
    return [...failureProbs].sort((a, b) => a.rul_days - b.rul_days);
  }, [failureProbs]);

  const runPipeline = async () => {
    if (!selected) return;
    setPipelineLoading(true);
    try {
      const data = await api.runPipeline(selected);
      setPipelineResult(data);
      toast.success("ML pipeline completed", { description: `Analysis for ${selected}` });
      // Fetch explainability data alongside results
      setExplainLoading(true);
      api.getExplainability(selected, { prediction: true, anomaly: true, rca: true })
        .then(setExplainabilityData)
        .catch(() => setExplainabilityData(null))
        .finally(() => setExplainLoading(false));
    } catch {
      setPipelineResult({ error: "Backend unavailable" });
      toast.error("Pipeline execution failed", { description: "Backend unavailable — please retry" });
    } finally {
      setPipelineLoading(false);
    }
  };

  const toggleCard = (key: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleSort = (field: "prob" | "rul" | "health") => {
    if (sortField === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const selectedEq = equipment.find(e => e.id === selected);
  const selectedProb = failureProbs.find(p => p.equipment_id === selected);

  const pipelineLayers = [
    { key: "anomaly", label: "L1: Anomaly Detection", color: "#f97316", desc: "Multi-sensor anomaly scoring using isolation forest and autoencoder models" },
    { key: "failure", label: "L2: Failure Classification", color: "#ef4444", desc: "CNN-LSTM classifier identifying failure type from sensor patterns" },
    { key: "rca", label: "L3: Root Cause Analysis", color: "#8b5cf6", desc: "Causal graph and Bayesian inference for root cause identification" },
    { key: "rul", label: "L4: RUL Estimation", color: "#3b82f6", desc: "Weibull and XGBoost models for remaining useful life prediction" },
    { key: "risk", label: "L5: Risk Assessment", color: "#eab308", desc: "Risk matrix scoring combining probability, consequence, and criticality" },
    { key: "maintenance", label: "L6: Maintenance Planning", color: "#22c55e", desc: "Optimal maintenance scheduling with cost optimization" },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-risk-high/15 border border-risk-high/25 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-risk-high" />
          </div>
          <h1 className="page-title">Predictive Maintenance Analytics</h1>
        </div>
        <p className="page-subtitle ml-11">9-layer ML pipeline analysis with failure probability forecasting and risk assessment</p>
      </div>

      {loading ? (
        <>
          <KpiRowSkeleton count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <ChartCardSkeleton height="md" />
            <ChartCardSkeleton height="md" />
          </div>
          <TableSkeleton rows={5} cols={5} />
        </>
      ) : (
        <>
      {/* Section: KPI Summary */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-panel-border" />
        <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">Fleet Summary</span>
        <div className="h-px flex-1 bg-panel-border" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Equipment Analyzed", value: failureProbs.length, icon: Gauge, color: "text-accent" },
          { label: "High Failure Risk (30d)", value: failureProbs.filter(p => p.probability_30d > 50).length, icon: AlertTriangle, color: "text-risk-high" },
          { label: "Avg RUL", value: `${failureProbs.length > 0 ? Math.round(failureProbs.reduce((s, p) => s + p.rul_days, 0) / failureProbs.length) : 0}d`, icon: Clock, color: "text-risk-medium" },
          { label: "Critical Assets", value: failureProbs.filter(p => p.risk_level === "critical").length, icon: Target, color: "text-risk-critical" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-hover text-center py-4">
            <div className="flex justify-center mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-steel-400 mt-1 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row: RUL Distribution + Risk Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* RUL Distribution */}
        <div className="card">
          <h3 className="text-sm font-semibold text-steel-100 mb-4">RUL Distribution</h3>
          {rulDist.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-steel-500 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rulDist} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="range" stroke={CHART_TEXT} fontSize={10} tickLine={false} />
                <YAxis stroke={CHART_TEXT} fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: "rgb(24,32,48)", border: "1px solid rgb(42,54,78)", borderRadius: "8px", fontSize: "11px" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {rulDist.map((d, i) => <Cell key={i} fill={d.color || "#3b82f6"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Risk Matrix Scatter */}
        <div className="card">
          <h3 className="text-sm font-semibold text-steel-100 mb-4">Risk Matrix</h3>
          {riskMatrixData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-steel-500 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis type="number" dataKey="probability" name="Failure Probability %" unit="%" stroke={CHART_TEXT} fontSize={9} tickLine={false} domain={[0, 100]} />
                <YAxis type="number" dataKey="consequence" name="Consequence" stroke={CHART_TEXT} fontSize={9} tickLine={false} domain={[0, 100]} />
                <ZAxis range={[40, 120]} />
                <Tooltip contentStyle={{ background: "rgb(24,32,48)", border: "1px solid rgb(42,54,78)", borderRadius: "8px", fontSize: "11px" }}
                  formatter={(value: number, name: string) => [name === "probability" ? `${value}%` : value, name === "probability" ? "Failure Prob" : "Consequence"]}
                  labelFormatter={(label) => riskMatrixData.find(d => d.id === label)?.name || label} />
                <Scatter name="Assets" data={riskMatrixData}>
                  {riskMatrixData.map((d) => (
                    <Cell key={d.id} fill={RISK_COLORS[d.risk_level] || RISK_COLORS.low} />
                  ))}
                </Scatter>
                {/* Quadrant lines */}
                <Legend wrapperStyle={{ fontSize: "10px", color: CHART_TEXT }} />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Section: Rankings */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-panel-border" />
        <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">Failure Probability Ranking</span>
        <div className="h-px flex-1 bg-panel-border" />
      </div>

      {/* Failure Probability Ranking Table */}
      <div className="card p-0 overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-panel-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-steel-100">Failure Probability Ranking</h3>
          <span className="text-[10px] text-steel-400">{sortedRanking.length} assets</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th>Asset</th>
                <th>
                  <button onClick={() => toggleSort("health")} className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-steel-400 hover:text-steel-200">
                    Health {sortField === "health" && (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                  </button>
                </th>
                <th>
                  <button onClick={() => toggleSort("prob")} className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-steel-400 hover:text-steel-200">
                    Failure Prob (30d) {sortField === "prob" && (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                  </button>
                </th>
                <th>
                  <button onClick={() => toggleSort("rul")} className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-steel-400 hover:text-steel-200">
                    RUL {sortField === "rul" && (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                  </button>
                </th>
                <th>Risk Level</th>
                <th>7-Day Prob</th>
                <th>14-Day Prob</th>
                <th className="w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedRanking.map((fp, i) => {
                const hr = healthRanking.find(h => h.id === fp.equipment_id);
                const hs = hr?.health_score ?? Math.round((1 - (fp.probability_30d / 100)) * 100);
                const color = healthColor(hs);
                const riskColor = RISK_COLORS[fp.risk_level] || RISK_COLORS.low;
                return (
                  <tr key={fp.equipment_id} className={`hover:bg-panel-hover/40 transition-colors ${selected === fp.equipment_id ? "bg-accent/5" : ""}`}
                    onClick={() => setSelected(fp.equipment_id)}>
                    <td className="text-steel-500 text-xs">{i + 1}</td>
                    <td>
                      <span className="font-mono font-semibold text-accent-light text-xs">{fp.equipment_id}</span>
                      <span className="text-steel-400 text-[10px] ml-2">{fp.name}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <ProbBar value={hs} color={color} />
                        <span className="text-[10px] font-mono w-8 text-right" style={{ color }}>{hs}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <ProbBar value={fp.probability_30d} color={riskColor} />
                        <span className="text-[10px] font-mono w-8 text-right" style={{ color: riskColor }}>{fp.probability_30d}%</span>
                      </div>
                    </td>
                    <td className={`font-mono text-xs font-semibold ${fp.rul_days < 15 ? "text-risk-critical" : fp.rul_days < 30 ? "text-risk-medium" : "text-risk-low"}`}>{fp.rul_days}d</td>
                    <td>
                      <span className={`badge text-[9px] capitalize ${fp.risk_level === "critical" ? "badge-critical" : fp.risk_level === "high" ? "badge-high" : fp.risk_level === "medium" ? "badge-medium" : "badge-low"}`}>{fp.risk_level}</span>
                    </td>
                    <td className="font-mono text-xs" style={{ color: RISK_COLORS[fp.risk_level] || RISK_COLORS.low }}>{fp.probability_7d}%</td>
                    <td className="font-mono text-xs" style={{ color: RISK_COLORS[fp.risk_level] || RISK_COLORS.low }}>{fp.probability_14d}%</td>
                    <td>
                      <button onClick={(e) => { e.stopPropagation(); setSelected(fp.equipment_id); runPipeline(); }}
                        className="text-[9px] text-accent hover:text-accent-light font-medium">
                        Analyze
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section: ML Pipeline */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-panel-border" />
        <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">ML Pipeline Analysis</span>
        <div className="h-px flex-1 bg-panel-border" />
      </div>

      {/* Pipeline Runner */}
      <div className="card mb-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-steel-100">
            <Play className="w-4 h-4 text-accent" /> ML Pipeline Analysis
          </div>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="bg-steel-800 border border-panel-border rounded-lg px-3 py-1.5 text-xs text-steel-200 focus:outline-none focus:border-accent/40"
          >
            {equipment.map((eq) => <option key={eq.id} value={eq.id}>{eq.id} — {eq.name}</option>)}
          </select>
          {selectedEq && (
            <span className="text-[11px] text-steel-400">
              Health: <span style={{ color: healthColor(Math.round((1 - selectedEq.anomaly_score) * 100)) }}>{Math.round((1 - selectedEq.anomaly_score) * 100)}%</span>
              <span className="mx-2">·</span>
              RUL: <span className={selectedEq.rul_days < 30 ? "text-risk-critical" : "text-risk-low"}>{selectedEq.rul_days}d</span>
            </span>
          )}
          <button onClick={runPipeline} disabled={pipelineLoading || !selected} className="btn-primary flex items-center gap-2 text-xs ml-auto">
            {pipelineLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run Pipeline
          </button>
        </div>

        {/* Pipeline layer cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pipelineLayers.map(({ key, label, color, desc }) => {
            const section = pipelineResult?.[key] as Record<string, unknown> | undefined;
            const isExpanded = expandedCards.has(key);
            const hasResult = !!section && Object.keys(section).length > 0;
            const confidence = section && (section.confidence as number) !== undefined ? Math.round((section.confidence as number) * 100) : undefined;
            return (
              <div key={key} className="card p-0 overflow-hidden border-panel-border" style={{ borderLeftWidth: "3px", borderLeftColor: color }}>
                <button onClick={() => toggleCard(key)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-panel-hover/40 transition-colors text-left">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-xs font-semibold text-steel-100">{label}</span>
                    {hasResult && <ConfidenceBadge pct={confidence ?? 85} />}
                  </div>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-steel-500" /> : <ChevronDown className="w-3.5 h-3.5 text-steel-500" />}
                </button>
                {isExpanded && (
                  <div className="px-4 py-3 border-t border-panel-border/50 bg-steel-850/40">
                    <p className="text-[10px] text-steel-400 mb-2">{desc}</p>
                    {hasResult ? (
                      <div className="space-y-1">
                        {Object.entries(section).slice(0, 5).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-[10px]">
                            <span className="text-steel-400 capitalize">{k.replace(/_/g, " ")}</span>
                            <span className="font-mono text-steel-200">{typeof v === "object" ? JSON.stringify(v).slice(0, 80) : String(v)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-steel-500 italic">{pipelineLoading ? "Running…" : "Run pipeline to see results"}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {pipelineResult && "executive_summary" in pipelineResult && (
          <div className="mt-4 p-4 rounded-lg bg-accent/5 border border-accent/20">
            <h4 className="text-sm font-semibold text-accent mb-2">Executive Summary</h4>
            <p className="text-xs text-steel-200 leading-relaxed whitespace-pre-wrap">{String(pipelineResult.executive_summary)}</p>
          </div>
        )}

        {/* AI Explainability */}
        {pipelineResult && !("error" in pipelineResult) && (
          <div className="mt-4">
            <ExplainabilityPanel
              data={explainabilityData}
              title="AI Explainability — Predictive Analysis"
              loading={explainLoading}
              compact
            />
          </div>
        )}
      </div>

      {/* RUL Ranking - Quick View */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-panel-border">
          <h3 className="text-sm font-semibold text-steel-100">RUL Ranking (Lowest First)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th>Asset</th>
                <th>Type</th>
                <th>RUL</th>
                <th>Failure Prob</th>
                <th>Risk</th>
                <th>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {rulRanking.slice(0, 10).map((fp, i) => {
                const hr = healthRanking.find(h => h.id === fp.equipment_id);
                const action = fp.rul_days < 10 ? "Emergency inspection + parts order"
                  : fp.rul_days < 20 ? "Schedule maintenance within 48h"
                  : fp.rul_days < 45 ? "Plan maintenance this week"
                  : "Routine monitoring";
                return (
                  <tr key={fp.equipment_id} className="hover:bg-panel-hover/40 transition-colors">
                    <td className="text-steel-500 text-xs">{i + 1}</td>
                    <td>
                      <span className="font-mono font-semibold text-accent-light text-xs">{fp.equipment_id}</span>
                      <span className="text-steel-400 text-[10px] ml-2">{fp.name}</span>
                    </td>
                    <td className="text-xs text-steel-400">{hr?.type || "—"}</td>
                    <td className={`font-mono text-xs font-semibold ${fp.rul_days < 15 ? "text-risk-critical" : fp.rul_days < 30 ? "text-risk-medium" : "text-risk-low"}`}>{fp.rul_days}d</td>
                    <td className="font-mono text-xs" style={{ color: RISK_COLORS[fp.risk_level] || RISK_COLORS.low }}>{fp.probability_30d}%</td>
                    <td>
                      <span className={`badge text-[9px] capitalize ${fp.risk_level === "critical" ? "badge-critical" : fp.risk_level === "high" ? "badge-high" : fp.risk_level === "medium" ? "badge-medium" : "badge-low"}`}>{fp.risk_level}</span>
                    </td>
                    <td className="text-[10px] text-steel-300">{action}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
