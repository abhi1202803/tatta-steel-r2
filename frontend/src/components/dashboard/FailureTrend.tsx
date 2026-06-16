"use client";

import AnomalyTrendChart from "@/components/charts/AnomalyTrendChart";

interface FailureTrendProps {
  data: { timestamp: string; score: number }[];
}

export default function FailureTrend({ data }: FailureTrendProps) {
  return <AnomalyTrendChart data={data} />;
}
