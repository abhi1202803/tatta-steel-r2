import { API_BASE } from "@/utils/constants";

export const reportsService = {
  generate: (equipmentId: string, reportType = "executive") =>
    fetch(`${API_BASE}/api/v1/reports/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipment_id: equipmentId, report_type: reportType }),
    }).then((res) => {
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json() as Promise<{ equipment_id: string; report_type: string; content: string }>;
    }),
};
