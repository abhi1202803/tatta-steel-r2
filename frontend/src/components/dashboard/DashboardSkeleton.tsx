export default function DashboardSkeleton() {
  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="skeleton skeleton-title w-64" />
          <div className="skeleton skeleton-text w-96" />
        </div>
        <div className="skeleton skeleton-badge w-24 h-8" />
      </div>
      {/* KPI Row 1 */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card py-5 flex flex-col items-center gap-3">
            <div className="skeleton skeleton-circle w-8 h-8" />
            <div className="skeleton skeleton-kpi w-20 h-8" />
            <div className="skeleton skeleton-text w-16 h-3" />
          </div>
        ))}
      </div>
      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card flex gap-4 py-4">
            <div className="skeleton skeleton-circle w-10 h-10 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton skeleton-text w-24 h-3" />
              <div className="skeleton skeleton-kpi w-20 h-7" />
            </div>
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card h-64"><div className="skeleton skeleton-chart h-full rounded-lg" /></div>
        <div className="card h-64"><div className="skeleton skeleton-chart h-full rounded-lg" /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card h-56"><div className="skeleton skeleton-chart h-full rounded-lg" /></div>
        <div className="card h-56"><div className="skeleton skeleton-chart h-full rounded-lg" /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card h-64"><div className="skeleton skeleton-chart h-full rounded-lg" /></div>
        <div className="card h-64"><div className="skeleton skeleton-chart h-full rounded-lg" /></div>
      </div>
      <div className="card h-72"><div className="skeleton skeleton-chart h-full rounded-lg" /></div>
    </div>
  );
}
