"use client";

import { useState } from "react";
import { api } from "@/services/api";
import { toast } from "sonner";
import { ThumbsUp, ThumbsDown, CheckCircle } from "lucide-react";

export default function FeedbackPage() {
  const [equipmentId, setEquipmentId] = useState("GBOX-03");
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [rootCause, setRootCause] = useState("");
  const [outcome, setOutcome] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (correct === null) return;
    try {
      await api.submitFeedback({
        equipment_id: equipmentId,
        recommendation_correct: correct,
        actual_root_cause: rootCause || undefined,
        repair_outcome: outcome || undefined,
      });
      setSubmitted(true);
      toast.success("Feedback submitted", { description: "Thank you for improving model accuracy" });
    } catch {
      setSubmitted(true);
      toast.error("Feedback submission failed");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
            <ThumbsUp className="w-4 h-4 text-accent" />
          </div>
          <h1 className="page-title">Feedback Center</h1>
        </div>
        <p className="page-subtitle ml-11">Close the agentic learning loop – improve recommendations over time</p>
      </div>

      {submitted ? (
        <div className="card flex items-center gap-4 border-risk-low/30">
          <CheckCircle className="w-10 h-10 text-risk-low" />
          <div>
            <p className="font-semibold">Feedback recorded</p>
            <p className="text-sm text-steel-300">Stored to case memory, knowledge graph, and training dataset.</p>
          </div>
        </div>
      ) : (
        <div className="card max-w-2xl space-y-6">
          <div>
            <label className="text-xs text-steel-400">Equipment ID</label>
            <input value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} className="input-field w-full mt-1" />
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Was the AI recommendation correct?</p>
            <div className="flex gap-4">
              <button type="button" onClick={() => setCorrect(true)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg border ${correct === true ? "border-risk-low bg-risk-low/10 text-risk-low" : "border-panel-border"}`}>
                <ThumbsUp className="w-4 h-4" /> Correct
              </button>
              <button type="button" onClick={() => setCorrect(false)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg border ${correct === false ? "border-risk-critical bg-risk-critical/10 text-risk-critical" : "border-panel-border"}`}>
                <ThumbsDown className="w-4 h-4" /> Incorrect
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-steel-400">Actual Root Cause</label>
            <input value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="e.g. Insufficient Lubrication" className="input-field w-full mt-1" />
          </div>

          <div>
            <label className="text-xs text-steel-400">Repair Outcome</label>
            <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="Describe repair actions and results..." className="input-field w-full mt-1 h-24 resize-none" />
          </div>

          <button type="button" onClick={submit} disabled={correct === null} className="btn-primary">Submit Feedback</button>
        </div>
      )}
    </div>
  );
}
