"use client";

import { useEffect, useMemo, useState } from "react";
import { api, type InventoryHealthItem } from "@/services/api";
import { Package, AlertTriangle, Loader2, TrendingDown, DollarSign, ShoppingCart, Clock, Gauge } from "lucide-react";
import { KpiRowSkeleton, ChartCardSkeleton, TableSkeleton, PageHeaderSkeleton, GaugeSkeleton } from "@/components/Skeletons";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { formatCurrency } from "@/utils/formatters";

const CHART_GRID = "rgb(42,54,78)";
const CHART_TEXT = "rgb(148,163,184)";

// ── Stock level bar with color indicator ──
function StockBar({ current, reorder }: { current: number; reorder: number }) {
  const ratio = reorder > 0 ? current / reorder : 0;
  const pct = Math.min(100, Math.round(ratio * 100));
  const color = ratio < 0.5 ? "rgb(239,68,68)" : ratio < 1 ? "rgb(234,179,8)" : "rgb(34,197,94)";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 bg-steel-800 rounded-full overflow-hidden flex-1 min-w-[48px]">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono w-6 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

// ── Inventory Health Gauge ──
function InventoryHealthGauge({ score }: { score: number }) {
  const color = score >= 80 ? "rgb(34,197,94)" : score >= 60 ? "rgb(234,179,8)" : "rgb(239,68,68)";
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="rgb(42,54,78)" strokeWidth="7" />
        <circle cx="56" cy="56" r={radius} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 56 56)"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x="56" y="52" textAnchor="middle" fill="#f8fafc" fontSize="22" fontWeight="700">{score}%</text>
        <text x="56" y="68" textAnchor="middle" fill="rgb(148,163,184)" fontSize="8">INVENTORY</text>
      </svg>
    </div>
  );
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryHealthItem[]>([]);
  const [healthScore, setHealthScore] = useState(0);
  const [atRiskValue, setAtRiskValue] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getInventoryHealth()
      .then(data => {
        setItems(data.items || []);
        setHealthScore(data.score);
        setLowStockCount(data.low_stock);
        setAtRiskValue(data.at_risk_value);
        setTotalValue((data.items || []).reduce((s, i) => s + i.quantity * i.unit_cost, 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Lead time analytics per supplier ──
  const leadTimeBySupplier = useMemo(() => {
    const map: Record<string, { total: number; count: number; name: string }> = {};
    items.forEach(i => {
      if (!map[i.supplier]) map[i.supplier] = { total: 0, count: 0, name: i.supplier };
      map[i.supplier].total += i.lead_time_days;
      map[i.supplier].count++;
    });
    return Object.values(map).map(s => ({ name: s.name, avg_lead_days: Math.round(s.total / s.count) })).sort((a, b) => b.avg_lead_days - a.avg_lead_days);
  }, [items]);

  // ── Stockout risk pie data ──
  const stockoutPieData = useMemo(() => {
    const high = items.filter(i => i.stockout_risk >= 70).length;
    const medium = items.filter(i => i.stockout_risk >= 30 && i.stockout_risk < 70).length;
    const low = items.filter(i => i.stockout_risk < 30).length;
    return [
      { name: "High Risk", value: high, color: "#ef4444" },
      { name: "Medium Risk", value: medium, color: "#eab308" },
      { name: "Low Risk", value: low, color: "#22c55e" },
    ];
  }, [items]);

  // ── Shortage prediction (sorted by days until shortage) ──
  const shortagePrediction = useMemo(() => {
    return items
      .filter(i => i.quantity <= i.reorder_level)
      .map(i => ({
        ...i,
        days_until_shortage: Math.max(1, Math.round((i.quantity / Math.max(1, (i.reorder_level || 1) / (i.lead_time_days || 7))) * (i.lead_time_days || 7))),
      }))
      .sort((a, b) => a.days_until_shortage - b.days_until_shortage);
  }, [items]);

  if (loading) {
    return (
      <div className="animate-fade-in-up">
        <PageHeaderSkeleton />
        <KpiRowSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <div className="card flex flex-col items-center justify-center py-4"><GaugeSkeleton size="lg" /></div>
          <ChartCardSkeleton height="md" />
          <ChartCardSkeleton height="md" />
        </div>
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-risk-medium/15 border border-risk-medium/25 flex items-center justify-center">
            <Package className="w-4 h-4 text-risk-medium" />
          </div>
          <h1 className="page-title">Inventory & Procurement</h1>
        </div>
        <p className="page-subtitle ml-11">Spare parts management with AI-driven reorder forecasting and inventory health monitoring</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="card-hover flex items-center gap-4 py-3">
          <div className="p-2.5 rounded-xl bg-risk-low/10 border border-risk-low/20 shrink-0">
            <Gauge className="w-5 h-5 text-risk-low" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-steel-50">{healthScore}%</p>
            <p className="text-[10px] uppercase tracking-wider text-steel-400">Inventory Health</p>
          </div>
        </div>
        <div className="card-hover flex items-center gap-4 py-3">
          <div className="p-2.5 rounded-xl bg-risk-critical/10 border border-risk-critical/20 shrink-0">
            <AlertTriangle className="w-5 h-5 text-risk-critical" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-risk-critical">{lowStockCount}</p>
            <p className="text-[10px] uppercase tracking-wider text-steel-400">Low Stock Items</p>
          </div>
        </div>
        <div className="card-hover flex items-center gap-4 py-3">
          <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 shrink-0">
            <DollarSign className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-steel-50">{formatCurrency(totalValue)}</p>
            <p className="text-[10px] uppercase tracking-wider text-steel-400">Total Value</p>
          </div>
        </div>
        <div className="card-hover flex items-center gap-4 py-3">
          <div className="p-2.5 rounded-xl bg-risk-high/10 border border-risk-high/20 shrink-0">
            <TrendingDown className="w-5 h-5 text-risk-high" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-risk-high">{formatCurrency(atRiskValue)}</p>
            <p className="text-[10px] uppercase tracking-wider text-steel-400">At-Risk Value</p>
          </div>
        </div>
      </div>

      {/* Section: Analytics */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-panel-border" />
        <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">Inventory Analytics</span>
        <div className="h-px flex-1 bg-panel-border" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Inventory Health Gauge */}
        <div className="card flex flex-col items-center justify-center py-4">
          <InventoryHealthGauge score={healthScore} />
          <p className="text-[10px] text-steel-400 mt-2">{items.length} items tracked</p>
        </div>

        {/* Lead Time Analytics */}
        <div className="card">
          <h3 className="text-sm font-semibold text-steel-100 mb-3">Lead Time by Supplier</h3>
          {leadTimeBySupplier.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-steel-500 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={leadTimeBySupplier} layout="vertical" margin={{ top: 0, right: 5, left: 50, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                <XAxis type="number" stroke={CHART_TEXT} fontSize={9} tickLine={false} unit="d" />
                <YAxis type="category" dataKey="name" stroke={CHART_TEXT} fontSize={9} tickLine={false} width={60} />
                <Tooltip contentStyle={{ background: "rgb(24,32,48)", border: "1px solid rgb(42,54,78)", borderRadius: "8px", fontSize: "11px" }} />
                <Bar dataKey="avg_lead_days" radius={[0, 4, 4, 0]} maxBarSize={20} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stockout Risk Pie */}
        <div className="card">
          <h3 className="text-sm font-semibold text-steel-100 mb-3">Stockout Risk Distribution</h3>
          {stockoutPieData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-steel-500 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stockoutPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={70} paddingAngle={2} dataKey="value">
                  {stockoutPieData.map(d => <Cell key={d.name} fill={d.color} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "rgb(24,32,48)", border: "1px solid rgb(42,54,78)", borderRadius: "8px", fontSize: "11px" }} />
                <Legend wrapperStyle={{ fontSize: "10px", color: CHART_TEXT }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Shortage Prediction Panel */}
      {shortagePrediction.length > 0 && (
        <div className="card mb-5 border-risk-high/30 bg-gradient-to-r from-risk-high/5 to-transparent">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-lg bg-risk-high/15 border border-risk-high/25 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-risk-high" />
            </div>
            <h3 className="text-sm font-semibold text-risk-high">Predicted Shortages</h3>
            <span className="text-[10px] text-steel-400">{shortagePrediction.length} items at risk</span>
          </div>
          <div className="space-y-2">
            {shortagePrediction.slice(0, 5).map(item => (
              <div key={item.part_name} className="flex items-center justify-between p-2.5 rounded-lg bg-steel-800/60 border border-panel-border">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-risk-high animate-pulse" />
                  <div>
                    <p className="text-xs font-medium text-steel-100">{item.part_name}</p>
                    <p className="text-[10px] text-steel-400">Stock: {item.quantity} · Reorder at: {item.reorder_level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-risk-high">{item.days_until_shortage}d</p>
                  <p className="text-[9px] text-steel-500">until shortage</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Procurement Recommendation Panel */}
      <div className="card mb-5 border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
            <ShoppingCart className="w-3.5 h-3.5 text-accent" />
          </div>
          <h3 className="text-sm font-semibold text-accent">AI Procurement Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {shortagePrediction.slice(0, 4).map(item => (
            <div key={item.part_name} className="p-3 rounded-lg bg-steel-800/60 border border-panel-border text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-steel-100">{item.part_name}</span>
                <span className="text-accent font-semibold">{formatCurrency(item.unit_cost * Math.max(1, item.reorder_level - item.quantity))}</span>
              </div>
              <p className="text-steel-400">
                Order {Math.max(1, item.reorder_level - item.quantity + Math.ceil(item.reorder_level * 0.5))} units from {item.supplier} ({item.lead_time_days}d lead)
              </p>
            </div>
          ))}
          {shortagePrediction.length === 0 && (
            <p className="text-xs text-steel-400 py-2 col-span-2">All items have adequate stock levels. No procurement actions needed.</p>
          )}
        </div>
      </div>

      {/* Section: Inventory Table */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-panel-border" />
        <span className="text-[10px] uppercase tracking-widest text-steel-500 font-semibold">Parts Inventory</span>
        <div className="h-px flex-1 bg-panel-border" />
      </div>

      {/* Parts Inventory Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-panel-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-steel-100">Spare Parts Inventory</h3>
          <span className="text-[10px] text-steel-400">{items.length} parts</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Part Name</th>
                <th>Stock Level</th>
                <th>Unit Cost</th>
                <th>Supplier</th>
                <th>Lead Time</th>
                <th>Stockout Risk</th>
                <th>Criticality</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const riskColor = item.stockout_risk >= 70 ? "text-risk-critical" : item.stockout_risk >= 30 ? "text-risk-medium" : "text-risk-low";
                return (
                  <tr key={item.part_name} className="hover:bg-panel-hover/40 transition-colors">
                    <td>
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-accent" />
                        <span className="text-xs font-medium text-steel-100">{item.part_name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <StockBar current={item.quantity} reorder={item.reorder_level} />
                        <span className={`text-[10px] font-mono ${item.quantity <= item.reorder_level ? "text-risk-critical font-bold" : "text-steel-300"}`}>
                          {item.quantity}
                        </span>
                      </div>
                    </td>
                    <td className="text-xs text-steel-300">{formatCurrency(item.unit_cost)}</td>
                    <td className="text-xs text-steel-300">{item.supplier}</td>
                    <td className="text-xs text-steel-300">{item.lead_time_days}d</td>
                    <td>
                      <span className={`text-[10px] font-semibold ${riskColor}`}>{item.stockout_risk}%</span>
                    </td>
                    <td>
                      <span className={`badge text-[9px] capitalize ${
                        item.criticality === "critical" ? "badge-critical" :
                        item.criticality === "high" ? "badge-high" :
                        item.criticality === "medium" ? "badge-medium" : "badge-low"
                      }`}>{item.criticality}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
