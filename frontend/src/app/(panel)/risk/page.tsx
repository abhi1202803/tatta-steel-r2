"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ShieldAlert } from "lucide-react";
import { api, type Alert, type Equipment } from "@/services/api";
import { PageHeaderSkeleton, ChartCardSkeleton } from "@/components/Skeletons";

const RiskDistributionChart = dynamic(() => import("@/components/charts/RiskDistributionChart"), {
  loading: () => <div className="card animate-pulse h-64" />,
});
const AlertList = dynamic(() => import("@/components/alerts/AlertList"), {
  loading: () => <div className="card animate-pulse h-48" />,
});
const RiskExplainabilitySection = dynamic(() => import("@/components/insights/RiskExplainabilitySection"), {
  loading: () => <div className="card animate-pulse h-48" />,
});

type DashboardData = {
  risk_distribution: Record<string, number>;
  recent_alerts: Alert[];
  equipment_summary: Equipment[];
};

export default function RiskPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch(() => {
        setData({
          risk_distribution: { low: 1, medium: 2, high: 1, critical: 1 },
          recent_alerts: [],
          equipment_summary: [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="animate-fade-in-up">
        <PageHeaderSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCardSkeleton height="lg" />
          <ChartCardSkeleton height="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-risk-critical/15 border border-risk-critical/25 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-risk-critical" />
          </div>
          <h1 className="page-title">Risk Monitoring</h1>
        </div>
        <p className="page-subtitle ml-11">Layer 5 – CatBoost Risk Engine with priority matrix and alert intelligence</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RiskDistributionChart data={data.risk_distribution} />
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Risk Priority Matrix</h3>
          <div className="space-y-3">
            {data.equipment_summary
              .sort((a, b) => b.anomaly_score - a.anomaly_score)
              .map((eq) => (
                <div key={eq.id} className="flex items-center justify-between p-3 bg-steel-900/40 rounded-lg">
                  <div>
                    <span className="font-mono text-accent-light text-sm">{eq.id}</span>
                    <p className="text-xs text-steel-100">{eq.name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold capitalize text-risk-${eq.risk_level}`}>
                      {eq.risk_level}
                    </p>
                    <p className="text-xs text-steel-100">RUL: {eq.rul_days}d</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <AlertList alerts={data.recent_alerts} />

      <RiskExplainabilitySection equipment={data.equipment_summary} />
    </div>
  );
}
