"use client";

import { useState } from "react";
import {
  Brain, Target, TrendingUp, FileText, BookOpen, Wrench,
  ChevronDown, ChevronUp, Database, History, ShieldCheck,
} from "lucide-react";
import type { ExplainabilityData } from "@/services/api";

interface Props {
  data: ExplainabilityData | null;
  title?: string;
  loading?: boolean;
  compact?: boolean;
}

function ConfidenceGauge({ value }: { value: number }) {
  const color = value >= 85 ? "rgb(34,197,94)" : value >= 65 ? "rgb(234,179,8)" : "rgb(239,68,68)";
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={radius} fill="none" stroke="rgb(42,54,78)" strokeWidth="6" />
        <circle cx="45" cy="45" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 45 45)"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x="45" y="42" textAnchor="middle" fill="#f8fafc" fontSize="16" fontWeight="700">{value}%</text>
        <text x="45" y="56" textAnchor="middle" fill="rgb(148,163,184)" fontSize="7">CONFIDENCE</text>
      </svg>
    </div>
  );
}

export default function ExplainabilityPanel({ data, title = "AI Explainability", loading = false, compact = false }: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["evidence", "sensors"]));

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="card space-y-4">
        <div className="skeleton skeleton-text w-40 h-4 mb-2" />
        <div className="flex justify-center">
          <div className="skeleton skeleton-circle w-20 h-20" />
        </div>
        <div className="space-y-2">
          <div className="skeleton h-12 rounded-lg" />
          <div className="skeleton h-12 rounded-lg" />
          <div className="skeleton h-12 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card text-center py-8">
        <Brain className="w-8 h-8 text-steel-600 mx-auto mb-3" />
        <p className="text-sm text-steel-400">No explainability data available</p>
        <p className="text-xs text-steel-500 mt-1">Run an analysis to see AI reasoning</p>
      </div>
    );
  }

  const sections = [
    {
      key: "evidence",
      icon: Target,
      label: "Supporting Evidence",
      content: (
        <ul className="space-y-1.5">
          {data.supporting_evidence.map((e, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-steel-300">
              <span className="text-accent mt-0.5 shrink-0">&#9679;</span>
              {e}
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: "sensors",
      icon: TrendingUp,
      label: "Sensor Trends Used",
      content: (
        <div className="flex flex-wrap gap-2">
          {data.sensor_trends_used.map((s, i) => (
            <span key={i} className="badge text-[10px] bg-accent/10 text-accent border border-accent/20">
              {s}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "cases",
      icon: History,
      label: "Similar Historical Cases",
      content: data.similar_cases.length > 0 ? (
        <div className="space-y-2">
          {data.similar_cases.map((c, i) => (
            <div key={i} className="bg-steel-800/60 rounded-lg p-2.5 border border-panel-border">
              <div className="flex justify-between items-start">
                <p className="text-xs text-steel-300">{c.description}</p>
                <span className="text-[10px] text-steel-500 shrink-0 ml-2">{c.date}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-steel-500">No similar historical cases found</p>
      ),
    },
    {
      key: "sops",
      icon: FileText,
      label: "SOP References",
      content: data.sop_references.length > 0 ? (
        <div className="space-y-2">
          {data.sop_references.map((sop, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-steel-300 bg-steel-800/60 rounded-lg p-2.5 border border-panel-border">
              <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="flex-1">{sop.title}</span>
              <span className="text-[10px] text-steel-500">{sop.id}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-steel-500">No SOP references</p>
      ),
    },
    {
      key: "docs",
      icon: BookOpen,
      label: "Knowledge Documents",
      content: data.knowledge_documents.length > 0 ? (
        <div className="space-y-2">
          {data.knowledge_documents.map((doc, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-steel-300 bg-steel-800/60 rounded-lg p-2.5 border border-panel-border">
              <BookOpen className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="flex-1">{doc.filename}</span>
              <span className="text-[10px] text-steel-500 capitalize">{doc.doc_type}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-steel-500">No knowledge documents referenced</p>
      ),
    },
    {
      key: "recommendations",
      icon: Wrench,
      label: "AI Recommendations",
      content: data.maintenance_recommendations.length > 0 ? (
        <ol className="space-y-2">
          {data.maintenance_recommendations.map((r, i) => (
            <li key={i} className="flex gap-3 text-xs p-2 rounded bg-steel-800 border border-panel-border">
              <span className="text-accent font-bold shrink-0">{i + 1}.</span>
              <span className="text-steel-200">{r}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-steel-500">No specific recommendations</p>
      ),
    },
  ];

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-panel-border flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-steel-100">{title}</h3>
      </div>

      {!compact && (
        <div className="px-4 py-4 flex justify-center border-b border-panel-border">
          <ConfidenceGauge value={data.confidence} />
        </div>
      )}

      <div className="divide-y divide-panel-border">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.key);

          return (
            <div key={section.key}>
              <button
                type="button"
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-steel-800/40 transition-colors text-left"
                onClick={() => toggleSection(section.key)}
              >
                <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-steel-800 border border-panel-border">
                  <section.icon className="w-3.5 h-3.5 text-steel-400" />
                </div>
                <span className="text-xs font-medium text-steel-300 flex-1">{section.label}</span>
                {isExpanded
                  ? <ChevronUp className="w-3.5 h-3.5 text-steel-500" />
                  : <ChevronDown className="w-3.5 h-3.5 text-steel-500" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-3 pl-14">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
