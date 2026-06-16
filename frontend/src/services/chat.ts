import { API_BASE } from "@/utils/constants";

export const chatService = {
  send: (message: string, equipmentId?: string) =>
    fetch(`${API_BASE}/api/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        equipment_id: equipmentId,
        include_pipeline_analysis: !!equipmentId,
      }),
    }).then((res) => {
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json() as Promise<{ response: string; recommendations: string[]; sources: string[] }>;
    }),
};
