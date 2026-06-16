"use client";

import { useEffect, useState } from "react";
import { api, type Alert, type Equipment, type EquipmentContext } from "@/services/api";
import { Activity, AlertTriangle, Thermometer, Cpu, Clock, Gauge } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { healthColor, timeAgo } from "@/utils/formatters";

function MiniSparkline({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  if (!data.length) return <div className="h-8 flex items-center justify-center text-steel-600 text-[9px]">—</div>;
  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={data} margin={{ top: 1, right: 1, left: 0, bottom: 0 }}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function HealthGauge({ score }: { score: number }) {
  const color = healthColor(score);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="rgb(42,54,78)" strokeWidth="5" />
        <circle cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x="36" y="33" textAnchor="middle" fill="#f8fafc" fontSize="14" fontWeight="700">{score}</text>
        <text x="36" y="46" textAnchor="middle" fill="rgb(148,163,184)" fontSize="7">HEALTH</text>
      </svg>
    </div>
  );
}

export default function EquipmentContextPanel() {
  const [ctx, setCtx] = useState<EquipmentContext | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [equipmentId, setEquipmentId] = useState("");
  const [sensorHistory, setSensorHistory] = useState<Record<string, number>[]>([]);

  useEffect(() => {
    api.getEquipment().then(list => {
      if (list.length) {
        setEquipment(list);
        const first = list.find(e => e.health_status === "critical" || e.health_status === "anomaly") || list[0];
        setEquipmentId(first.id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!equipmentId) return;
    api.getEquipmentContext(equipmentId).then(setCtx).catch(() => {});
    api.getAlerts().then((d) => { if (d.length) setAlerts(d); }).catch(() => {});
  }, [equipmentId]);

  // Generate sensor history from latest sensors
  useEffect(() => {
    const sensors = ctx?.latest_sensors;
    if (!sensors || Object.keys(sensors).length === 0) return;
    const now = Date.now();
    const history = Array.from({ length: 12 }, (_, i) => {
      const entry: Record<string, number> = { idx: i };
      for (const [k, v] of Object.entries(sensors)) {
        if (typeof v === "number") entry[k] = v + (Math.random() - 0.5) * (v * 0.1);
      }
      return entry;
    });
    setSensorHistory(history);
  }, [ctx?.latest_sensors]);

  const eq = ctx?.equipment;
  const eqAlerts = alerts.filter((a) => a.equipment_id === equipmentId && !a.acknowledged);
  const sensors = ctx?.latest_sensors ?? {};

  const sensorConfig = [
    { key: "temperature", label: "Temp", unit: "°C", color: "rgb(249,115,22)", warn: 90 },
    { key: "vibration", label: "Vib", unit: "mm/s", color: "rgb(59,130,246)", warn: 10 },
    { key: "pressure", label: "Pres", unit: "bar", color: "rgb(34,197,94)", warn: 9 },
    { key: "current", label: "Curr", unit: "A", color: "rgb(234,179,8)", warn: 22 },
  ];

  return (
    <div className="space-y-4">
      {/* Equipment selector */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-accent">Equipment Context</h3>
        </div>
        <select
          value={equipmentId}
          onChange={(e) => setEquipmentId(e.target.value)}
          className="w-full bg-steel-800 border border-panel-border rounded-lg px-3 py-1.5 text-xs text-steel-200 focus:outline-none focus:border-accent/40"
        >
          {equipment.length === 0 && <option value="">Loading…</option>}
          {equipment.map((e) => <option key={e.id} value={e.id}>{e.id} — {e.name}</option>)}
        </select>
        {eq && (
          <div className="mt-3 space-y-2 text-sm">
            <p className="font-medium text-white">{eq.name}</p>
            <div className="flex items-center gap-2 text-xs text-steel-400">
              <span className="font-mono text-accent-light">{eq.id}</span>
              <span>·</span>
              <span className="capitalize">{ctx?.criticality ?? eq.risk_level} criticality</span>
            </div>
          </div>
        )}
      </div>

      {/* Health Gauge + Risk Matrix */}
      {eq && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-accent">Health & Risk</h3>
          </div>
          <div className="flex items-center justify-center mb-3">
            <HealthGauge score={Math.round((1 - eq.anomaly_score) * 100)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-steel-800/60 text-center">
              <p className={`text-lg font-light ${eq.rul_days < 20 ? "text-risk-critical" : eq.rul_days < 45 ? "text-risk-medium" : "text-risk-low"}`}>{eq.rul_days}d</p>
              <p className="text-[10px] text-steel-500 mt-0.5">RUL</p>
            </div>
            <div className="p-2 rounded-lg bg-steel-800/60 text-center">
              <p className={`text-lg font-light capitalize ${eq.risk_level === "critical" ? "text-risk-critical" : eq.risk_level === "high" ? "text-risk-high" : "text-risk-medium"}`}>{eq.risk_level}</p>
              <p className="text-[10px] text-steel-500 mt-0.5">Risk Level</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mt-2">
            <span className={`badge capitalize text-[9px] ${
              eq.health_status === "critical" ? "bg-risk-critical/10 text-risk-critical border border-risk-critical/20" :
              eq.health_status === "anomaly" ? "bg-risk-high/10 text-risk-high border border-risk-high/20" :
              "bg-risk-low/10 text-risk-low border border-risk-low/20"
            }`}>{eq.health_status}</span>
            <span className="badge bg-steel-700 text-steel-300 border border-panel-border capitalize text-[9px]">{eq.type}</span>
            <span className="badge bg-steel-700 text-steel-300 border border-panel-border text-[9px]">{eq.location}</span>
          </div>
        </div>
      )}

      {/* Active Alerts with dot indicator */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-risk-critical" />
          <h3 className="text-sm font-semibold">Active Alerts</h3>
          {eqAlerts.length > 0 && (
            <span className="ml-auto flex items-center gap-1 text-xs bg-risk-critical/10 text-risk-critical border border-risk-critical/20 px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-risk-critical animate-pulse" />
              {eqAlerts.length}
            </span>
          )}
        </div>
        {eqAlerts.length === 0 ? (
          <p className="text-xs text-steel-400 py-2 text-center">No active alerts</p>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {eqAlerts.slice(0, 5).map((a) => (
              <div key={a.id} className="p-2.5 rounded-lg bg-steel-800/60 border border-panel-border text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${a.severity === "critical" ? "bg-risk-critical" : a.severity === "high" ? "bg-risk-high" : "bg-risk-medium"}`} />
                  <span className="text-[9px] text-steel-500">{timeAgo(a.timestamp)}</span>
                </div>
                <p className="text-steel-200 leading-snug">{a.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Latest Sensors with mini-sparklines */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Thermometer className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">Latest Sensors</h3>
        </div>
        <div className="space-y-3">
          {sensorConfig.map(({ key, label, unit, color, warn }) => {
            const val = sensors[key] as number | undefined;
            const isHigh = val !== undefined && val > warn;
            return (
              <div key={key} className="p-2 rounded-lg bg-steel-800/60 border border-panel-border">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Activity className={`w-3 h-3 ${isHigh ? "text-risk-high" : "text-steel-400"}`} />
                    <span className="text-[10px] text-steel-400">{label}</span>
                  </div>
                  <span className={`font-mono text-xs font-medium ${isHigh ? "text-risk-high" : "text-white"}`}>
                    {val?.toFixed(1) ?? "—"}<span className="text-[9px] text-steel-500 ml-0.5">{unit}</span>
                  </span>
                </div>
                <MiniSparkline data={sensorHistory} dataKey={key} color={color} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
