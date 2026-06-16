"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Brain, Target, DollarSign, Clock, Wrench, Package } from "lucide-react";
import type { ExecutiveInsightFull } from "@/services/api";

interface Props {
  insights: ExecutiveInsightFull[];
  loading?: boolean;
  compact?: boolean;
}

const SEV_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: "text-risk-critical", bg: "bg-risk-critical/10", border: "border-risk-critical/25", label: "CRITICAL" },
  high: { color: "text-risk-high", bg: "bg-risk-high/10", border: "border-risk-high/25", label: "HIGH" },
  medium: { color: "text-risk-medium", bg: "bg-risk-medium/10", border: "border-risk-medium/25", label: "MEDIUM" },
  low: { color: "text-risk-low", bg: "bg-risk-low/10", border: "border-risk-low/25", label: "LOW" },
};

type InsightIcon = typeof AlertTriangle;

const CAT_ICONS: Record<string, InsightIcon> = {
  failure_prediction: AlertTriangle,
  critical_assets: AlertTriangle,
  alerts: AlertTriangle,
  inventory: Package,
  downtime: Clock,
  cost: DollarSign,
};

function MiniConfidenceGauge({ value }: { value: number }) {
  const color = value >= 85 ? "rgb(34,197,94)" : value >= 65 ? "rgb(234,179,8)" : "rgb(239,68,68)";
  const circumference = 2 * Math.PI * 10;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="shrink-0">
      <circle cx="14" cy="14" r="10" fill="none" stroke="rgb(42,54,78)" strokeWidth="3" />
      <circle cx="14" cy="14" r="10" fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 14 14)" />
      <text x="14" y="16" textAnchor="middle" fill="rgb(203,213,225)" fontSize="7" fontWeight="700">{value}</text>
    </svg>
  );
}

export default function ExecutiveInsightsPanel({ insights, loading = false, compact = false }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="card space-y-3">
        <div className="skeleton skeleton-text w-40 h-4 mb-2" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-xl bg-steel-800/60" />
        ))}
      </div>
    );
  }

  if (!insights.length) {
    return (
      <div className="card text-center py-8">
        <Brain className="w-8 h-8 text-steel-600 mx-auto mb-3" />
        <p className="text-sm text-steel-400">No insights available</p>
        <p className="text-xs text-steel-500 mt-1">Insights will appear as data is analyzed</p>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-panel-border flex items-center gap-2">
        <Brain className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-steel-100">AI Executive Insights</h3>
        <span className="ml-auto badge text-[9px] bg-accent/10 text-accent border border-accent/20">
          {insights.length} insights
        </span>
      </div>

      <div className="divide-y divide-panel-border">
        {insights.map((insight) => {
          const sev = SEV_CONFIG[insight.severity] || SEV_CONFIG.medium;
          const CatIcon = CAT_ICONS[insight.category] || Brain;
          const isExpanded = expanded.has(insight.id);

          return (
            <div key={insight.id} className={`group transition-colors ${sev.bg} border-l-2 ${sev.border}`}>
              <div
                className="px-4 py-3 cursor-pointer hover:bg-steel-800/40 transition-colors"
                onClick={() => toggle(insight.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${sev.bg} border ${sev.border}`}>
                    <CatIcon className={`w-4 h-4 ${sev.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-semibold uppercase tracking-wider ${sev.color}`}>
                        {sev.label}
                      </span>
                      <span className="text-[9px] text-steel-500 capitalize">{insight.category.replace(/_/g, " ")}</span>
                      <span className="text-[9px] text-steel-600">{insight.timestamp?.slice(11, 16) || ""}</span>
                    </div>

                    <p className={`text-sm leading-snug ${insight.severity === "critical" ? "text-steel-50 font-medium" : "text-steel-300"}`}>
                      {insight.message}
                    </p>

                    {!compact && (
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <MiniConfidenceGauge value={insight.confidence} />
                          <span className="text-[10px] text-steel-500">{insight.confidence}% conf.</span>
                        </div>

                        {insight.cost_impact > 0 && (
                          <span className="text-[10px] text-risk-low flex items-center gap-1">
                            <DollarSign className="w-2.5 h-2.5" />
                            ${(insight.cost_impact / 1000).toFixed(0)}K impact
                          </span>
                        )}

                        {insight.related_equipment.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {insight.related_equipment.slice(0, 3).map((eq) => (
                              <span key={eq} className="badge text-[9px] bg-steel-800 border border-panel-border text-steel-400">
                                {eq}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {!compact && (
                      <div className="flex items-center gap-2 mt-2">
                        <Wrench className="w-3 h-3 text-steel-500" />
                        <span className="text-[10px] text-steel-400">{insight.recommended_action}</span>
                      </div>
                    )}
                  </div>

                  <button className="shrink-0 mt-1 text-steel-500 group-hover:text-steel-300">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expandable evidence section */}
              {isExpanded && (
                <div className="px-4 pb-3 pl-14">
                  <div className="bg-steel-800/80 rounded-lg p-3 border border-panel-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-3 h-3 text-accent" />
                      <span className="text-[10px] font-semibold text-steel-400 uppercase tracking-wider">Evidence</span>
                    </div>
                    <p className="text-xs text-steel-300 leading-relaxed">{insight.evidence_summary}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
