import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  colorClass?: string;
  trend?: { value: number; direction: "up" | "down" | "neutral" };
  index?: number;
}

export default function StatCard({ title, value, subtitle, icon: Icon, color, colorClass, trend, index = 0 }: StatCardProps) {
  return (
    <motion.div
      className="kpi-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.4, 0, 0.2, 1] }}
    >
      <div
        className="kpi-card-icon"
        style={{
          background: color ? `${color.replace("rgb(", "rgba(").replace(")", "/0.12)")}` : "rgb(var(--accent-rgb)/0.12)",
          border: `1px solid ${color ? `${color.replace("rgb(", "rgba(").replace(")", "/0.25)")}` : "rgb(var(--accent-rgb)/0.25)"}`,
        }}
      >
        <Icon
          className={`w-5 h-5 ${colorClass || "text-accent"}`}
          style={!colorClass && color ? { color } : undefined}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="kpi-card-label mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <span
            className="kpi-card-value text-steel-50"
            style={color ? { color } : undefined}
          >
            {value}
          </span>
          {trend && (
            <span className={`kpi-card-trend ${
              trend.direction === "up" ? "kpi-card-trend-up" :
              trend.direction === "down" ? "kpi-card-trend-down" :
              "kpi-card-trend-neutral"
            }`}>
              {trend.direction === "up" ? <TrendingUp className="w-3 h-3" /> :
               trend.direction === "down" ? <TrendingDown className="w-3 h-3" /> :
               <Minus className="w-3 h-3" />}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-steel-500 mt-1.5">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
