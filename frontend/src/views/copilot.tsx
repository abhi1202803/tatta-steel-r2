"use client";

import dynamic from "next/dynamic";
import { MessageSquare } from "lucide-react";

const ChatWindow = dynamic(() => import("@/components/copilot/ChatWindow"), {
  loading: () => <div className="card animate-pulse h-96" />,
});
const EquipmentContextPanel = dynamic(() => import("@/components/copilot/EquipmentContextPanel"), {
  loading: () => <div className="card animate-pulse h-64" />,
});

export default function CopilotPage() {
  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-accent" />
          </div>
          <h1 className="page-title">AI Maintenance Copilot</h1>
        </div>
        <p className="page-subtitle ml-11">Natural language interaction with multi-agent orchestration and RAG knowledge base</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ChatWindow />
        </div>
        <EquipmentContextPanel />
      </div>
    </div>
  );
}
