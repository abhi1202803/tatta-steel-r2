"use client";

/** Reusable skeleton components matching the industrial dark theme */

export function KpiCardSkeleton() {
  return (
    <div className="card flex items-start gap-4 py-4 px-5">
      <div className="skeleton skeleton-circle w-10 h-10 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton skeleton-text w-20 h-3" />
        <div className="skeleton skeleton-kpi w-16 h-7" />
        <div className="skeleton skeleton-text w-24 h-2.5 mt-1" />
      </div>
    </div>
  );
}

export function KpiRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartCardSkeleton({ height = "md" }: { height?: "sm" | "md" | "lg" | "xl" }) {
  const cls = `skeleton-chart-${height}`;
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="skeleton skeleton-text w-32 h-4" />
        <div className="skeleton skeleton-badge w-16 h-6" />
      </div>
      <div className={`skeleton ${cls} w-full`} />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-panel-border">
        <div className="skeleton skeleton-text w-40 h-4" />
      </div>
      <div className="p-3 space-y-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-3">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="skeleton skeleton-text h-5 rounded"
                style={{ width: `${60 + Math.random() * 40}%`, flex: c === 0 ? "0 0 100px" : 1 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailPanelSkeleton() {
  return (
    <div className="card space-y-4">
      <div className="skeleton skeleton-title w-48 h-6" />
      <div className="flex gap-4">
        <div className="skeleton skeleton-circle w-16 h-16" />
        <div className="flex-1 space-y-2">
          <div className="skeleton skeleton-text w-32 h-3" />
          <div className="skeleton skeleton-kpi w-20 h-8" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="skeleton skeleton-text w-full h-3" />
        <div className="skeleton skeleton-text w-3/4 h-3" />
        <div className="skeleton skeleton-text w-1/2 h-3" />
      </div>
    </div>
  );
}

export function TimelineSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="card space-y-3">
      <div className="skeleton skeleton-text w-40 h-4 mb-4" />
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-3 rounded-lg bg-steel-800/60 border border-panel-border space-y-2">
          <div className="flex justify-between">
            <div className="skeleton skeleton-badge w-20 h-5" />
            <div className="skeleton skeleton-text w-24 h-3" />
          </div>
          <div className="skeleton skeleton-text w-3/4 h-3" />
          <div className="skeleton skeleton-text w-1/2 h-3" />
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton({ messages = 3 }: { messages?: number }) {
  return (
    <div className="card space-y-4 p-5">
      {Array.from({ length: messages }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
          <div
            className="skeleton rounded-2xl"
            style={{
              width: `${50 + Math.random() * 30}%`,
              height: `${40 + Math.random() * 30}px`,
              maxWidth: "80%",
            }}
          />
        </div>
      ))}
      <div className="flex gap-2 pt-2 border-t border-panel-border">
        <div className="skeleton flex-1 h-10 rounded-xl" />
        <div className="skeleton skeleton-circle w-10 h-10 shrink-0" />
      </div>
    </div>
  );
}

export function ContextPanelSkeleton() {
  return (
    <div className="card space-y-4">
      <div className="skeleton skeleton-text w-32 h-4" />
      <div className="flex justify-center">
        <div className="skeleton skeleton-gauge" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="skeleton h-10 rounded-lg" />
        <div className="skeleton h-10 rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="skeleton skeleton-text w-24 h-3" />
        <div className="skeleton skeleton-sparkline w-full" />
        <div className="skeleton skeleton-sparkline w-full" />
        <div className="skeleton skeleton-sparkline w-full" />
      </div>
    </div>
  );
}

export function GaugeSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = { sm: 72, md: 112, lg: 130 };
  return (
    <div className="flex flex-col items-center">
      <div
        className="skeleton skeleton-circle"
        style={{ width: dims[size], height: dims[size] }}
      />
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="card max-w-2xl space-y-4">
      <div className="skeleton skeleton-text w-40 h-5 mb-2" />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="skeleton skeleton-text w-24 h-3" />
          <div className="skeleton h-10 rounded-xl w-full" />
        </div>
      ))}
      <div className="skeleton h-10 rounded-xl w-32" />
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-8 space-y-2">
      <div className="skeleton skeleton-title w-72 h-8" />
      <div className="skeleton skeleton-text w-96 h-4" />
    </div>
  );
}

export function TabsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-1 border-b border-panel-border pb-0 mb-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-8 rounded-t-lg" style={{ width: `${70 + Math.random() * 40}px` }} />
      ))}
    </div>
  );
}

export function AlertListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card py-3 px-4 flex items-center gap-3">
          <div className="skeleton skeleton-badge w-14 h-5 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton skeleton-text w-3/4 h-3" />
            <div className="skeleton skeleton-text w-1/2 h-2.5" />
          </div>
          <div className="skeleton skeleton-text w-20 h-3 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ cards = 6, cols = 3 }: { cards?: number; cols?: number }) {
  const colClass = cols === 2 ? "md:grid-cols-2" : cols === 3 ? "md:grid-cols-3" : cols === 4 ? "md:grid-cols-4" : "md:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 ${colClass} gap-4`}>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="card space-y-3 py-4">
          <div className="skeleton skeleton-text w-24 h-3" />
          <div className="skeleton skeleton-kpi w-16 h-8" />
          <div className="skeleton skeleton-text w-32 h-2.5" />
        </div>
      ))}
    </div>
  );
}

export function HeatmapSkeleton({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
  const colors = [
    "rgb(34,197,94,0.15)", "rgb(234,179,8,0.15)", "rgb(249,115,22,0.15)", "rgb(239,68,68,0.15)",
    "rgb(34,197,94,0.08)", "rgb(234,179,8,0.08)", "rgb(59,130,246,0.08)", "rgb(239,68,68,0.08)",
  ];
  return (
    <div className="card">
      <div className="skeleton skeleton-text w-32 h-4 mb-4" />
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}>
        {Array.from({ length: rows * cols }).map((_, i) => (
          <div
            key={i}
            className="skeleton rounded-lg"
            style={{
              height: `${60 + Math.random() * 40}px`,
              background: colors[i % colors.length],
              border: "1px solid rgb(42,54,78)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton skeleton-text w-32 h-4" />
        <div className="flex gap-1">
          <div className="skeleton skeleton-badge w-16 h-6" />
          <div className="skeleton skeleton-badge w-16 h-6" />
          <div className="skeleton skeleton-badge w-16 h-6" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-text h-4 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="skeleton rounded-lg"
            style={{ height: `${50 + Math.random() * 30}px`, opacity: 0.5 + Math.random() * 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}

export function InsightCardSkeleton() {
  return (
    <div className="card border-l-2 border-l-steel-700 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="skeleton skeleton-badge w-14 h-5" />
          <div className="skeleton skeleton-text w-28 h-3" />
        </div>
        <div className="skeleton skeleton-circle w-7 h-7" />
      </div>
      <div className="skeleton skeleton-text w-full h-4" />
      <div className="skeleton skeleton-text w-3/4 h-4" />
      <div className="flex gap-2">
        <div className="skeleton skeleton-badge w-20 h-5" />
        <div className="skeleton skeleton-badge w-20 h-5" />
        <div className="skeleton skeleton-badge w-20 h-5" />
      </div>
      <div className="flex justify-between items-center">
        <div className="skeleton skeleton-text w-24 h-3" />
        <div className="skeleton h-7 w-16 rounded-lg" />
      </div>
    </div>
  );
}

export function ExplainabilitySkeleton() {
  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <div className="skeleton skeleton-circle w-8 h-8" />
        <div className="skeleton skeleton-text w-48 h-4" />
      </div>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center">
          <div className="skeleton skeleton-gauge" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="skeleton skeleton-text w-32 h-3" />
          <div className="skeleton skeleton-text w-full h-3" />
          <div className="skeleton skeleton-text w-3/4 h-3" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border border-panel-border rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="skeleton skeleton-circle w-6 h-6" />
            <div className="skeleton skeleton-text w-32 h-3" />
          </div>
          <div className="skeleton skeleton-circle w-5 h-5" />
        </div>
      ))}
    </div>
  );
}

export function CommandCenterSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center gap-3">
          <div className="skeleton skeleton-circle w-8 h-8" />
          <div className="skeleton skeleton-title w-64 h-7" />
        </div>
        <div className="skeleton skeleton-text w-96 h-4 ml-11" />
      </div>
      {/* 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column - heatmap */}
        <div className="space-y-5">
          <HeatmapSkeleton rows={4} cols={3} />
        </div>
        {/* Center column - KPIs */}
        <div className="space-y-5">
          <div className="card flex justify-center">
            <div className="skeleton skeleton-gauge" style={{ width: 150, height: 150 }} />
          </div>
          <KpiRowSkeleton count={2} />
          <div className="card space-y-3">
            <div className="skeleton skeleton-text w-36 h-4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton skeleton-text w-20 h-3" />
                <div className="skeleton flex-1 h-3 rounded" />
                <div className="skeleton skeleton-badge w-14 h-5" />
              </div>
            ))}
          </div>
        </div>
        {/* Right column - insights */}
        <div className="space-y-5">
          <div className="card space-y-4">
            <div className="skeleton skeleton-text w-40 h-4" />
            {Array.from({ length: 3 }).map((_, i) => (
              <InsightCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
