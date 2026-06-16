import { API_BASE } from "@/utils/constants";

type AlertHandler = (alert: unknown) => void;

export const websocketService = {
  connect: (onAlert: AlertHandler) => {
    if (typeof window === "undefined") return () => {};
    const wsUrl = API_BASE.replace(/^http/, "ws") + "/ws/alerts";
    try {
      const ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => onAlert(JSON.parse(event.data));
      return () => ws.close();
    } catch {
      return () => {};
    }
  },
};
