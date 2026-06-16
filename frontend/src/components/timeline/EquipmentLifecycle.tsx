"use client";

import { useEffect, useState } from "react";
import {
  Clock, Wrench, AlertTriangle, TrendingUp, GitBranch, CheckCircle2,
  ThumbsUp, BookMarked, Download, Play, Calendar, ChevronDown, ChevronUp,
  Filter,
} from "lucide-react";
import { api, type LifecycleEvent } from "@/services/api";
import { TimelineSkeleton } from "@/components/Skeletons";

interface Props {
  equipmentId: string;
}

const EVENT_CONFIG: Record<string, {
  icon: typeof Clock; color: string; bg: string; border: string; label: string;
}> = {
  installation: { icon: Play, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/25", label: "Installation" },
  maintenance: { icon: Wrench, color: "text-risk-low", bg: "bg-risk-low/10", border: "border-risk-low/25", label: "Maintenance" },
  alert: { icon: AlertTriangle, color: "text-risk-critical", bg: "bg-risk-critical/10", border: "border-risk-critical/25", label: "Alert" },
  prediction: { icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/25", label: "Prediction" },
  rca: { icon: GitBranch, color: "text-risk-high", bg: "bg-risk-high/10", border: "border-risk-high/25", label: "RCA" },
  repair: { icon: CheckCircle2, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/25", label: "Repair" },
  feedback: { icon: ThumbsUp, color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/25", label: "Feedback" },
  logbook: { icon: BookMarked, color: "text-steel-400", bg: "bg-steel-500/10", border: "border-steel-500/25", label: "Logbook" },
};

const EVENT_SEV_COLORS: Record<string, string> = {
  critical: "bg-risk-critical",
  high: "bg-risk-high",
  medium: "bg-risk-medium",
  low: "bg-risk-low",
};

export default function EquipmentLifecycle({ equipmentId }: Props) {
  const [events, setEvents] = useState<LifecycleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    api.getEquipmentLifecycle(equipmentId)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [equipmentId]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleFilter = (type: string) => {
    setTypeFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  const filteredEvents = typeFilters.size > 0
    ? events.filter(e => typeFilters.has(e.type))
    : events;

  const types = Array.from(new Set(events.map(e => e.type)));

  if (loading) {
    return (
      <div>
        <div className="flex gap-2 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-7 w-20 rounded-xl" />
          ))}
        </div>
        <TimelineSkeleton items={5} />
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="card text-center py-8">
        <Clock className="w-8 h-8 text-steel-600 mx-auto mb-3" />
        <p className="text-sm text-steel-400">No lifecycle events found</p>
        <p className="text-xs text-steel-500 mt-1">Events will appear as equipment data is collected</p>
      </div>
    );
  }

  return (
    <div>
      {/* Type filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${
            typeFilters.size === 0
              ? "bg-accent/10 text-accent border-accent/30"
              : "bg-steel-800 text-steel-400 border-panel-border hover:text-steel-200"
          }`}
          onClick={() => setTypeFilters(new Set())}
        >
          <Filter className="w-3 h-3" /> All
        </button>
        {types.map(type => {
          const config = EVENT_CONFIG[type] || EVENT_CONFIG.logbook;
          const active = typeFilters.has(type);
          return (
            <button
              key={type}
              type="button"
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                active
                  ? `${config.bg} ${config.color} ${config.border}`
                  : "bg-steel-800 text-steel-400 border-panel-border hover:text-steel-200"
              }`}
              onClick={() => toggleFilter(type)}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Vertical timeline */}
      <div className="relative pl-8">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-panel-border" />

        <div className="space-y-1">
          {filteredEvents.map((event) => {
            const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.logbook;
            const Icon = config.icon;
            const isExpanded = expanded.has(event.id);
            const sevDot = event.severity ? EVENT_SEV_COLORS[event.severity] || "bg-steel-500" : "";

            return (
              <div key={event.id} className="relative pb-4">
                {/* Timeline node */}
                <div className={`absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border-2 ${config.bg} ${config.border} flex items-center justify-center`}>
                  {sevDot && <span className={`w-2 h-2 rounded-full ${sevDot}`} />}
                </div>

                {/* Event card */}
                <div
                  className={`rounded-lg border ${config.border} ${config.bg} overflow-hidden cursor-pointer hover:border-opacity-60 transition-all`}
                  onClick={() => toggleExpand(event.id)}
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`w-3.5 h-3.5 ${config.color} shrink-0`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${config.color}`}>
                              {config.label}
                            </span>
                            {event.severity && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${EVENT_SEV_COLORS[event.severity] || "bg-steel-500"} text-white/90 uppercase`}>
                                {event.severity}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-steel-200 mt-1">{event.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-steel-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {event.date}
                        </span>
                        {isExpanded
                          ? <ChevronUp className="w-3.5 h-3.5 text-steel-500" />
                          : <ChevronDown className="w-3.5 h-3.5 text-steel-500" />}
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-xs text-steel-400 mt-2 leading-relaxed">{event.description}</p>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-panel-border/50 pt-3">
                      <div className="bg-steel-800/80 rounded-lg p-3 border border-panel-border">
                        <h4 className="text-[10px] font-semibold text-steel-400 uppercase tracking-wider mb-2">Full Details</h4>
                        <div className="space-y-1.5">
                          {Object.entries(event.metadata).map(([key, value]) => {
                            if (value === undefined || value === null || value === "") return null;
                            const displayValue = typeof value === "object" ? JSON.stringify(value) : String(value);
                            return (
                              <div key={key} className="flex gap-2 text-xs">
                                <span className="text-steel-500 capitalize shrink-0">{key.replace(/_/g, " ")}:</span>
                                <span className="text-steel-300 break-all">{displayValue}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
