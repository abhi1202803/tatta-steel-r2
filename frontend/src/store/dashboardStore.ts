import type { DashboardData } from "@/services/api";

let data: DashboardData | null = null;

export const dashboardStore = {
  getData: () => data,
  setData: (next: DashboardData) => {
    data = next;
  },
};
