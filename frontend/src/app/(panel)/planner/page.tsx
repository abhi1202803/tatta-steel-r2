"use client";

import { useEffect, useState } from "react";
import { api, type Equipment } from "@/services/api";
import { Calendar, Clock, Users, DollarSign } from "lucide-react";
import { KpiRowSkeleton, TimelineSkeleton, PageHeaderSkeleton } from "@/components/Skeletons";

export default function PlannerPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("PUMP-05");
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.getEquipment()
      .then(setEquipment)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.runPipeline(selected).then(setPlan).catch(() => setPlan(null));
  }, [selected]);

  const maintenance = plan?.maintenance as Record<string, unknown> | undefined;
  const rul = plan?.rul as Record<string, unknown> | undefined;

  if (loading) {
    return (
      <div>
        <PageHeaderSkeleton />
        <KpiRowSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
          <TimelineSkeleton items={4} />
          <TimelineSkeleton items={4} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-accent" />
          </div>
          <h1 className="page-title">Maintenance Planner</h1>
        </div>
        <p className="page-subtitle ml-11">AI-optimized maintenance scheduling with cost and downtime estimates</p>
      </div>

      <div className="card mb-6">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="input-field">
          {equipment.map((e) => <option key={e.id} value={e.id}>{e.id} – {e.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Clock, label: "Maintenance Window", value: String(maintenance?.maintenance_window ?? "Within 72h") },
          { icon: DollarSign, label: "Cost Savings Est.", value: `$${Number(maintenance?.cost_savings_estimate ?? 25000).toLocaleString()}` },
          { icon: Calendar, label: "RUL Remaining", value: `${rul?.rul_days ?? "—"} days` },
          { icon: Users, label: "Recommended Action", value: String(maintenance?.recommended_action ?? "schedule_maintenance").replace(/_/g, " ") },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="card-hover">
            <Icon className="w-5 h-5 text-accent mb-2" />
            <p className="text-xs text-steel-400">{label}</p>
            <p className="font-semibold mt-1 capitalize">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Autonomous Repair Plan</h3>
          <ol className="space-y-2">
            {((maintenance?.autonomous_plan as string[]) ?? [
              "Schedule preventive maintenance", "Verify spare parts availability",
              "Prepare maintenance work order", "Coordinate production downtime",
            ]).map((step, i) => (
              <li key={i} className="flex gap-3 text-sm p-2 rounded bg-steel-800">
                <span className="text-accent font-bold">{i + 1}.</span>{step}
              </li>
            ))}
          </ol>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Timeline View</h3>
          {["Today", "Tomorrow", "Next Week", "Next Month"].map((period) => (
            <div key={period} className="flex justify-between py-3 border-b border-panel-border text-sm">
              <span className="text-steel-300">{period}</span>
              <span className="text-accent">{period === "Today" ? "Monitor" : period === "Tomorrow" ? "Inspect" : "Scheduled PM"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
