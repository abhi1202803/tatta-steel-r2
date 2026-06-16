"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { api, type ExplainabilityData, type Equipment } from "@/services/api";
import ExplainabilityPanel from "@/components/insights/ExplainabilityPanel";

interface Props {
  equipment: Equipment[];
}

export default function RiskExplainabilitySection({ equipment }: Props) {
  const [selected, setSelected] = useState("");
  const [explainabilityData, setExplainabilityData] = useState<ExplainabilityData | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchExplainability = async (id: string) => {
    if (!id) return;
    setExplainLoading(true);
    setFetched(false);
    try {
      const data = await api.getExplainability(id, { prediction: true, anomaly: true, rca: true });
      setExplainabilityData(data);
      setFetched(true);
    } catch {
      setExplainabilityData(null);
    } finally {
      setExplainLoading(false);
    }
  };

  const selectedEq = equipment.find(e => e.id === selected);

  return (
    <div className="card mt-6">
      <h3 className="text-sm font-semibold text-steel-100 mb-4 flex items-center gap-2">
        <Search className="w-4 h-4 text-accent" /> Risk Assessment Explainability
      </h3>

      <div className="flex items-center gap-3 mb-4">
        <select
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            fetchExplainability(e.target.value);
          }}
          className="bg-steel-800 border border-panel-border rounded-lg px-3 py-2 text-xs text-steel-200 focus:outline-none focus:border-accent/40"
        >
          <option value="">Select equipment to explain risk…</option>
          {equipment.map((e) => (
            <option key={e.id} value={e.id}>
              {e.id} — {e.name} ({e.risk_level} risk)
            </option>
          ))}
        </select>
        {selectedEq && (
          <span className="text-[11px] text-steel-400">
            Health:{" "}
            <span className={selectedEq.health_status === "critical" ? "text-risk-critical" : "text-risk-medium"}>
              {selectedEq.health_status}
            </span>
            <span className="mx-2">·</span>
            RUL:{" "}
            <span className={selectedEq.rul_days < 20 ? "text-risk-critical" : "text-risk-low"}>
              {selectedEq.rul_days}d
            </span>
          </span>
        )}
        {explainLoading && <Loader2 className="w-4 h-4 animate-spin text-accent ml-auto" />}
      </div>

      {fetched && explainabilityData && (
        <ExplainabilityPanel
          data={explainabilityData}
          title="AI Explainability — Risk Assessment"
          loading={explainLoading}
          compact
        />
      )}
      {fetched && !explainabilityData && !explainLoading && (
        <p className="text-xs text-steel-400 py-4 text-center">
          No explainability data available for this equipment.
        </p>
      )}
      {!fetched && !explainLoading && (
        <p className="text-xs text-steel-500 py-4 text-center italic">
          Select equipment above to view risk assessment explainability
        </p>
      )}
    </div>
  );
}
