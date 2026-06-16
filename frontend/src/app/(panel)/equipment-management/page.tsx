"use client";

import { useEffect, useState } from "react";
import { api, type Equipment } from "@/services/api";
import { Cpu, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { TableSkeleton, DetailPanelSkeleton, PageHeaderSkeleton } from "@/components/Skeletons";

export default function EquipmentManagementPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selected, setSelected] = useState<Equipment | null>(null);
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: "", name: "", type: "", location: "", criticality: "medium" });

  const load = () => api.getEquipment().then(setEquipment).catch(() => {});

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const selectEquipment = async (eq: Equipment) => {
    setSelected(eq);
    try {
      const [pred, history, alerts] = await Promise.all([
        api.getEquipmentPredictions(eq.id),
        api.getEquipmentHistory(eq.id),
        api.getEquipmentAlerts(eq.id),
      ]);
      setDetails({ predictions: pred, history: history.history, alerts: alerts.alerts });
    } catch {
      setDetails(null);
    }
  };

  const createEquipment = async () => {
    await api.createEquipment(form);
    setShowForm(false);
    setForm({ id: "", name: "", type: "", location: "", criticality: "medium" });
    load();
  };

  const deleteEquipment = async (id: string) => {
    await api.deleteEquipment(id);
    if (selected?.id === id) { setSelected(null); setDetails(null); }
    load();
  };

  const healthColor = (s: string) =>
    ({ critical: "text-risk-critical", anomaly: "text-risk-critical", warning: "text-risk-high", normal: "text-risk-low" }[s] || "text-steel-300");

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-accent" />
            </div>
            <h1 className="page-title">Equipment Management</h1>
          </div>
          <p className="page-subtitle ml-11">Register, configure, and monitor plant equipment assets</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Equipment
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><TableSkeleton rows={8} cols={6} /></div>
          <div><DetailPanelSkeleton /></div>
        </div>
      ) : (
        <>
      {showForm && (
        <div className="card mb-6 space-y-3">
          <h3 className="font-semibold text-sm">New Equipment</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["id", "name", "type", "location"] as const).map((f) => (
              <input key={f} placeholder={f} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} className="input-field" />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={createEquipment} className="btn-primary flex items-center gap-1"><Save className="w-3.5 h-3.5" /> Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex items-center gap-1"><X className="w-3.5 h-3.5" /> Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-panel-border text-left text-xs text-steel-400 uppercase">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3">RUL</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((eq) => (
                <tr
                  key={eq.id}
                  onClick={() => selectEquipment(eq)}
                  className={`border-b border-panel-border/50 cursor-pointer hover:bg-panel-hover transition-colors ${selected?.id === eq.id ? "bg-accent/5" : ""}`}
                >
                  <td className="px-4 py-3 font-mono text-accent-light text-xs">{eq.id}</td>
                  <td className="px-4 py-3">{eq.name}</td>
                  <td className="px-4 py-3 text-steel-400">{eq.type}</td>
                  <td className={`px-4 py-3 capitalize font-medium ${healthColor(eq.health_status)}`}>{eq.health_status}</td>
                  <td className="px-4 py-3">{eq.rul_days}d</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={(e) => { e.stopPropagation(); deleteEquipment(eq.id); }} className="text-steel-500 hover:text-risk-critical" aria-label={`Delete equipment ${eq.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          {selected ? (
            <div>
              <h3 className="font-semibold mb-1">{selected.name}</h3>
              <p className="text-xs text-steel-400 mb-4">{selected.location}</p>
              {details && (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs text-steel-500 uppercase mb-1">Predictions</p>
                    <pre className="text-xs bg-steel-900/50 p-2 rounded">{JSON.stringify(details.predictions, null, 2)}</pre>
                  </div>
                  <div>
                    <p className="text-xs text-steel-500 uppercase mb-1">History ({(details.history as unknown[])?.length || 0})</p>
                  </div>
                  <div>
                    <p className="text-xs text-steel-500 uppercase mb-1">Alerts ({(details.alerts as unknown[])?.length || 0})</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-steel-400 text-sm">
              <Edit2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-medium text-steel-300">No equipment selected</p>
              <p className="text-xs text-steel-500 mt-1">Click a row to view equipment details</p>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
