"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type Alert, type AlertAnalytics } from "@/services/api";
import { alertStore } from "@/store/alertStore";

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>(alertStore.getAlerts());
  const [analytics, setAnalytics] = useState<AlertAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [data, ana] = await Promise.all([api.getAlerts(), api.getAlertAnalytics()]);
      alertStore.setAlerts(data);
      setAlerts(data);
      setAnalytics(ana);
    } catch {
      setAlerts(alertStore.getAlerts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { alerts, analytics, loading, refresh };
}
