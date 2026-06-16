import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RiskCardProps {
  title: string;
  level: string;
  score: number;
  index?: number;
}

const LEVEL_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  critical: {
    bg: "rgb(var(--risk-critical-rgb)/0.08)",
    border: "rgb(var(--risk-critical-rgb)/0.3)",
    text: "rgb(var(--risk-critical-rgb))",
    glow: "0 0 20px rgb(var(--risk-critical-rgb)/0.15)",
  },
  high: {
    bg: "rgb(var(--risk-high-rgb)/0.08)",
    border: "rgb(var(--risk-high-rgb)/0.3)",
    text: "rgb(var(--risk-high-rgb))",
    glow: "0 0 20px rgb(var(--risk-high-rgb)/0.15)",
  },
  medium: {
    bg: "rgb(var(--risk-medium-rgb)/0.08)",
    border: "rgb(var(--risk-medium-rgb)/0.3)",
    text: "rgb(var(--risk-medium-rgb))",
    glow: "0 0 20px rgb(var(--risk-medium-rgb)/0.15)",
  },
  low: {
    bg: "rgb(var(--risk-low-rgb)/0.08)",
    border: "rgb(var(--risk-low-rgb)/0.3)",
    text: "rgb(var(--risk-low-rgb))",
    glow: "0 0 20px rgb(var(--risk-low-rgb)/0.15)",
  },
};

export default function RiskCard({ title, level, score, index = 0 }: RiskCardProps) {
  const styles = LEVEL_STYLES[level] || LEVEL_STYLES.medium;
  const pct = Math.round(score * 100);

  return (
    <motion.div
      className="card-hover relative overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      style={{ borderColor: styles.border }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: styles.text }} />
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-steel-400">{title}</h4>
        <AlertTriangle className="w-3.5 h-3.5" style={{ color: styles.text }} />
      </div>
      <p className="text-xl font-bold capitalize mb-2" style={{ color: styles.text }}>{level}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 progress-bar">
          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: styles.text }} />
        </div>
        <span className="text-xs font-mono font-semibold" style={{ color: styles.text }}>{pct}%</span>
      </div>
    </motion.div>
  );
}
