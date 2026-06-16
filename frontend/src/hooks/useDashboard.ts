"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type DashboardData, type PlantHealthScore, type MTBFMetrics, type FailureProbability, type RULDistributionItem, type EquipmentHealthRanking, type ZoneHealthItem, type ExecutiveInsight } from "@/services/api";
import { dashboardStore } from "@/store/dashboardStore";

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(dashboardStore.getData());
  const [loading, setLoading] = useState(false);
  const [plantHealth, setPlantHealth] = useState<PlantHealthScore | null>(null);
  const [mtbf, setMTBF] = useState<MTBFMetrics | null>(null);
  const [failureProbs, setFailureProbs] = useState<FailureProbability[]>([]);
  const [rulDist, setRulDist] = useState<RULDistributionItem[]>([]);
  const [healthRanking, setHealthRanking] = useState<EquipmentHealthRanking[]>([]);
  const [zoneHealth, setZoneHealth] = useState<ZoneHealthItem[]>([]);
  const [insights, setInsights] = useState<ExecutiveInsight[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const overview = await api.getDashboard();
      dashboardStore.setData(overview);
      setData(overview);
      const [ph, m, fp, rd, hr, zh, ei] = await Promise.all([
        api.getPlantHealth(), api.getMTBFMetrics(), api.getFailureProbabilities(),
        api.getRULDistribution(), api.getEquipmentHealthRanking(), api.getZoneHealth(),
        api.getExecutiveInsights(),
      ]);
      setPlantHealth(ph); setMTBF(m); setFailureProbs(fp); setRulDist(rd);
      setHealthRanking(hr); setZoneHealth(zh); setInsights(ei);
    } catch {
      setData(dashboardStore.getData());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh, plantHealth, mtbf, failureProbs, rulDist, healthRanking, zoneHealth, insights };
}
