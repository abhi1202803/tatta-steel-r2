export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
}

export function formatRiskLevel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function formatHoursToDays(hours: number): string {
  if (hours >= 24) return `${(hours / 24).toFixed(1)}d`;
  return `${hours.toFixed(0)}h`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function timeAgo(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function healthColor(score: number): string {
  if (score >= 80) return "rgb(var(--risk-low-rgb))";
  if (score >= 60) return "rgb(var(--risk-medium-rgb))";
  if (score >= 40) return "rgb(var(--risk-high-rgb))";
  return "rgb(var(--risk-critical-rgb))";
}
