export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const CHAT_SUGGESTIONS = [
  "Why is this asset critical?",
  "Show highest risk assets",
  "What maintenance is due?",
  "Show inventory shortages",
  "Explain prediction for this equipment",
] as const;

export const QUICK_ACTIONS = [
  { id: "critical", label: "Why is this asset critical?", icon: "AlertTriangle" },
  { id: "risk", label: "Show highest risk assets", icon: "TrendingUp" },
  { id: "maintenance", label: "What maintenance is due?", icon: "Wrench" },
  { id: "inventory", label: "Show inventory shortages", icon: "Package" },
  { id: "explain", label: "Explain prediction", icon: "Brain" },
] as const;
