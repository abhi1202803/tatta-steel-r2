import type { Alert } from "@/services/api";

let alerts: Alert[] = [];

export const alertStore = {
  getAlerts: () => alerts,
  setAlerts: (next: Alert[]) => {
    alerts = next;
  },
};
