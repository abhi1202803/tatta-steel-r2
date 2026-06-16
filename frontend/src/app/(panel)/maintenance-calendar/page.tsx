"use client";

import { useEffect, useMemo, useState } from "react";
import { api, type MaintenanceScheduleItem } from "@/services/api";
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, Wrench, AlertTriangle,
  CheckCircle2, Filter, Search,
} from "lucide-react";

type ViewMode = "daily" | "weekly" | "monthly";

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "text-risk-critical", bg: "bg-risk-critical/10", border: "border-risk-critical/30" },
  high: { color: "text-risk-high", bg: "bg-risk-high/10", border: "border-risk-high/30" },
  medium: { color: "text-risk-medium", bg: "bg-risk-medium/10", border: "border-risk-medium/30" },
  low: { color: "text-risk-low", bg: "bg-risk-low/10", border: "border-risk-low/30" },
};

const STATUS_ICONS: Record<string, typeof Clock> = {
  scheduled: Clock,
  in_progress: Wrench,
  completed: CheckCircle2,
  overdue: AlertTriangle,
};

const STATUS_CONFIG: Record<string, string> = {
  scheduled: "text-steel-400",
  in_progress: "text-accent",
  completed: "text-risk-low",
  overdue: "text-risk-critical",
};

function CalendarGrid({
  view, date, items, onDateClick, selectedDate,
}: {
  view: ViewMode; date: Date; items: MaintenanceScheduleItem[];
  onDateClick: (d: Date) => void; selectedDate: string | null;
}) {
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const today = new Date().toISOString().slice(0, 10);

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = new Date(date.getFullYear(), date.getMonth(), i + 1);
    const dateStr = day.toISOString().slice(0, 10);
    const dayItems = items.filter(item => item.scheduled_date === dateStr);
    return { day, dateStr, items: dayItems };
  });

  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="card overflow-hidden p-0">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-panel-border">
        {dayHeaders.map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-semibold text-steel-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* Empty cells for first week */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[80px] p-1 border-b border-r border-panel-border/50 bg-steel-900/50" />
        ))}

        {days.map(({ day, dateStr, items: dayItems }) => {
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const hasCritical = dayItems.some(i => i.priority === "critical");

          return (
            <button
              key={dateStr}
              type="button"
              className={`min-h-[80px] p-1 border-b border-r border-panel-border/50 text-left hover:bg-steel-800/60 transition-colors relative ${
                isSelected ? "bg-accent/5 ring-1 ring-accent/30" : ""
              }`}
              onClick={() => onDateClick(day)}
            >
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                isToday ? "bg-accent text-steel-900" : "text-steel-300"
              }`}>
                {day.getDate()}
              </span>

              {hasCritical && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-risk-critical animate-pulse" />
              )}

              <div className="mt-0.5 space-y-0.5">
                {dayItems.slice(0, 2).map(item => {
                  const p = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
                  return (
                    <div
                      key={item.id}
                      className={`text-[9px] px-1 py-0.5 rounded truncate ${p.bg} ${p.color} border-l-2 ${p.border}`}
                      title={`${item.equipment_id}: ${item.description}`}
                    >
                      {item.equipment_id}
                    </div>
                  );
                })}
                {dayItems.length > 2 && (
                  <span className="text-[9px] text-steel-500 pl-1">+{dayItems.length - 2} more</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MaintenanceCalendarPage() {
  const [items, setItems] = useState<MaintenanceScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    api.getMaintenanceSchedule(view)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [view]);

  const navigate = (dir: number) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (view === "monthly") d.setMonth(d.getMonth() + dir);
      else if (view === "weekly") d.setDate(d.getDate() + dir * 7);
      else d.setDate(d.getDate() + dir);
      return d;
    });
  };

  const togglePriority = (p: string) => {
    setFilterPriority(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  };

  const toggleStatus = (s: string) => {
    setFilterStatus(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  const filteredItems = useMemo(() => {
    let result = items;
    if (filterPriority.size > 0) result = result.filter(i => filterPriority.has(i.priority));
    if (filterStatus.size > 0) result = result.filter(i => filterStatus.has(i.status));
    return result;
  }, [items, filterPriority, filterStatus]);

  const selectedDayItems = selectedDate
    ? filteredItems.filter(item => item.scheduled_date === selectedDate)
    : [];

  const counts = useMemo(() => ({
    critical: items.filter(i => i.priority === "critical").length,
    high: items.filter(i => i.priority === "high").length,
    medium: items.filter(i => i.priority === "medium").length,
    low: items.filter(i => i.priority === "low").length,
    overdue: items.filter(i => i.status === "overdue").length,
  }), [items]);

  const monthLabel = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <div className="skeleton skeleton-title w-64 h-8 mb-2" />
          <div className="skeleton skeleton-text w-96 h-4" />
        </div>
        <div className="card p-0 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-panel-border">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="py-3 text-center">
                <div className="skeleton h-4 w-8 mx-auto" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[80px] p-1 border-b border-r border-panel-border/50">
                <div className="skeleton w-6 h-6 rounded-full mb-1" />
                <div className="skeleton h-3 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="page-header-icon">
                <CalendarDays className="w-4 h-4 text-accent-light" />
              </div>
              <h1 className="page-title">Maintenance Calendar</h1>
            </div>
            <p className="page-subtitle ml-12">Schedule, track, and optimize maintenance operations across the plant</p>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-steel-800 rounded-xl p-1 border border-panel-border">
            {(["daily", "weekly", "monthly"] as ViewMode[]).map(mode => (
              <button
                key={mode}
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                  view === mode ? "bg-accent text-steel-900" : "text-steel-400 hover:text-steel-200"
                }`}
                onClick={() => setView(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {[
          { label: "Critical", value: counts.critical, color: "text-risk-critical", bg: "bg-risk-critical/10", border: "border-risk-critical/25" },
          { label: "High", value: counts.high, color: "text-risk-high", bg: "bg-risk-high/10", border: "border-risk-high/25" },
          { label: "Medium", value: counts.medium, color: "text-risk-medium", bg: "bg-risk-medium/10", border: "border-risk-medium/25" },
          { label: "Low", value: counts.low, color: "text-risk-low", bg: "bg-risk-low/10", border: "border-risk-low/25" },
          { label: "Overdue", value: counts.overdue, color: "text-risk-critical", bg: "bg-risk-critical/10", border: "border-risk-critical/25" },
        ].map(kpi => (
          <div key={kpi.label} className={`card text-center py-3 ${kpi.bg} border ${kpi.border}`}>
            <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-steel-400 uppercase tracking-wider mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Section: Schedule */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-panel-border" />
        <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">Maintenance Schedule</span>
        <div className="h-px flex-1 bg-panel-border" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Main calendar */}
        <div className="lg:col-span-3">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button type="button" className="btn-secondary text-xs p-2" onClick={() => navigate(-1)} aria-label="Previous period">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-semibold text-steel-200 w-40 text-center">{monthLabel}</h3>
              <button type="button" className="btn-secondary text-xs p-2" onClick={() => navigate(1)} aria-label="Next period">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3 text-steel-500" />
              {["critical", "high", "medium", "low"].map(p => {
                const config = PRIORITY_CONFIG[p] || PRIORITY_CONFIG.medium;
                const active = filterPriority.has(p);
                return (
                  <button
                    key={p}
                    type="button"
                    className={`text-[9px] px-2 py-0.5 rounded-full border capitalize transition-colors ${
                      active ? `${config.bg} ${config.color} ${config.border}` : "bg-steel-800 text-steel-500 border-panel-border hover:text-steel-300"
                    }`}
                    onClick={() => togglePriority(p)}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <CalendarGrid
            view={view}
            date={currentDate}
            items={filteredItems}
            onDateClick={(d) => setSelectedDate(d.toISOString().slice(0, 10))}
            selectedDate={selectedDate}
          />
        </div>

        {/* Sidebar: Event list for selected date */}
        <div className="lg:col-span-1 space-y-4">
          {/* Upcoming maintenance */}
          <div className="card p-0 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-panel-border">
              <h3 className="text-xs font-semibold text-steel-300">
                {selectedDate ? `Events — ${selectedDate}` : "Upcoming Maintenance"}
              </h3>
            </div>
            <div className="divide-y divide-panel-border max-h-[500px] overflow-y-auto">
              {(selectedDayItems.length > 0 ? selectedDayItems : filteredItems.slice(0, 8)).map(item => {
                const p = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
                const StatusIcon = STATUS_ICONS[item.status] || Clock;
                const sc = STATUS_CONFIG[item.status] || "text-steel-400";

                return (
                  <div key={item.id} className="px-3 py-2.5 hover:bg-steel-800/40 transition-colors">
                    <div className="flex items-start gap-2">
                      <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${p.bg} border ${p.border}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${p.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-medium text-steel-200 truncate">{item.equipment_id}</span>
                          <span className={`text-[9px] px-1 py-0 rounded ${p.bg} ${p.color} uppercase shrink-0`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-[10px] text-steel-400 leading-relaxed">{item.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[9px] text-steel-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {item.scheduled_date}
                          </span>
                          <span className={`text-[9px] capitalize ${sc}`}>{item.status.replace(/_/g, " ")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredItems.length === 0 && (
                <div className="px-3 py-6 text-center">
                  <p className="text-xs text-steel-500">No maintenance events found</p>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="card">
            <h3 className="text-xs font-semibold text-steel-300 mb-3">Legend</h3>
            <div className="space-y-2">
              {[
                { label: "Critical / Overdue", dot: "bg-risk-critical" },
                { label: "High Priority", dot: "bg-risk-high" },
                { label: "Medium Priority", dot: "bg-risk-medium" },
                { label: "Low Priority / Routine", dot: "bg-risk-low" },
                { label: "Completed", dot: "bg-risk-low", extra: "check" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-[10px] text-steel-400">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
