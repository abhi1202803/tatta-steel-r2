"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Sparkles, ThumbsUp, ThumbsDown, Copy, CheckCircle2, Circle, FileText, Database, Zap } from "lucide-react";
import { api, type Equipment } from "@/services/api";

const CHAT_STORAGE_KEY = "copilot_chat_history";

interface Message {
  role: "user" | "assistant";
  content: string;
  recommendations?: string[];
  sources?: string[];
  pipeline_results?: Record<string, unknown>;
  knowledge?: { excerpt: string; document: string }[];
  confidence?: number;
  ts?: number;
  feedback?: "up" | "down" | null;
}

const QUICK_ACTIONS = [
  { label: "Why is this asset critical?", icon: Zap },
  { label: "Show highest risk assets", icon: Sparkles },
  { label: "What maintenance is due?", icon: FileText },
  { label: "Show inventory shortages", icon: Database },
  { label: "Explain prediction for current asset", icon: Bot },
];

function loadHistory(): Message[] {
  try {
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(msgs: Message[]) {
  try { sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(msgs.slice(-50))); } catch { /* ignore */ }
}

function confidenceColor(v: number): string {
  if (v >= 85) return "text-risk-low";
  if (v >= 65) return "text-risk-medium";
  return "text-risk-high";
}

export default function CopilotChat() {
  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [equipmentId, setEquipmentId] = useState("");
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  // Persist history
  useEffect(() => { saveHistory(messages); }, [messages]);

  // Fetch equipment list
  useEffect(() => {
    api.getEquipment().then(list => {
      if (list.length) {
        setEquipmentList(list);
        const first = list.find(e => e.health_status === "critical" || e.health_status === "anomaly") || list[0];
        setEquipmentId(first.id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text, ts: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const result = await api.copilotChat(text, equipmentId || undefined);
      const pipeline = result.pipeline_results || {};
      const confidence = pipeline && typeof pipeline === "object" && "confidence" in pipeline
        ? Math.round((pipeline as any).confidence * 100)
        : pipeline && typeof pipeline === "object" && "overall_confidence" in pipeline
          ? Math.round((pipeline as any).overall_confidence * 100)
          : undefined;

      // Build knowledge excerpts from sources
      const knowledge = (result.sources || []).slice(0, 3).map((src: string) => ({
        excerpt: src.length > 120 ? src.slice(0, 120) + "…" : src,
        document: src,
      }));

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: result.response,
          recommendations: result.recommendations,
          sources: result.sources,
          pipeline_results: result.pipeline_results,
          knowledge,
          confidence,
          ts: Date.now(),
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Unable to reach the maintenance API. Please ensure the backend is running on port 8000.\n\nYou can still browse other pages while the backend initializes.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, equipmentId]);

  const setFeedback = (idx: number, fb: "up" | "down") => {
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, feedback: m.feedback === fb ? null : fb } : m));
  };

  const copyToReport = (content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
  };

  const toggleCheckItem = (msgIdx: number, recIdx: number) => {
    const key = `${msgIdx}-${recIdx}`;
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="card p-0 flex flex-col h-[calc(100vh-11rem)] overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-panel-border"
        style={{ background: "linear-gradient(135deg, rgba(15,98,254,0.08), transparent)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Industrial Maintenance Copilot</p>
            <p className="text-[10px] text-steel-400">Multi-agent orchestration · RAG knowledge base</p>
          </div>
        </div>
        <select
          value={equipmentId}
          onChange={(e) => setEquipmentId(e.target.value)}
          className="bg-steel-800 border border-panel-border rounded-lg px-3 py-1.5 text-xs text-steel-200 focus:outline-none focus:border-accent/40 max-w-[140px]"
        >
          {equipmentList.length === 0 && <option value="">Loading…</option>}
          {equipmentList.map((eq) => <option key={eq.id} value={eq.id}>{eq.id}</option>)}
        </select>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-base font-semibold text-white">Ask me anything</h3>
            <p className="text-steel-400 text-sm mt-1 max-w-xs">
              Get AI-powered insights on equipment health, failure analysis, and maintenance planning
            </p>
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(label)}
                  className="text-xs px-3 py-2 rounded-lg bg-steel-800 border border-panel-border hover:border-accent/40 hover:text-accent transition-all text-steel-300 flex items-center gap-1.5"
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 animate-fade-in-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 text-accent" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-accent/15 border border-accent/20 text-white"
                : "bg-steel-800 border border-panel-border"
            }`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

              {/* Confidence Score */}
              {msg.confidence !== undefined && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-steel-700 rounded-full overflow-hidden max-w-[120px]">
                    <div className={`h-full rounded-full transition-all ${msg.confidence >= 85 ? "bg-risk-low" : msg.confidence >= 65 ? "bg-risk-medium" : "bg-risk-high"}`}
                      style={{ width: `${msg.confidence}%` }} />
                  </div>
                  <span className={`text-[10px] font-semibold ${confidenceColor(msg.confidence)}`}>{msg.confidence}% confidence</span>
                </div>
              )}

              {/* Retrieved Knowledge */}
              {msg.knowledge && msg.knowledge.length > 0 && (
                <div className="mt-3 pt-3 border-t border-panel-border/50">
                  <p className="text-[10px] font-semibold text-steel-400 uppercase tracking-wider mb-2">Retrieved Knowledge</p>
                  <div className="space-y-1.5">
                    {msg.knowledge.map((k, j) => (
                      <div key={j} className="p-2 rounded bg-steel-750 border border-panel-border/40 text-[10px] text-steel-300 leading-relaxed">
                        <span className="text-steel-500">📄 {k.document.length > 60 ? k.document.slice(0, 60) + "…" : k.document}</span>
                        <p className="mt-0.5 text-steel-400">{k.excerpt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations as interactive checklist */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-panel-border">
                  <p className="text-[10px] font-semibold text-accent uppercase tracking-wider mb-2">Recommended Actions</p>
                  <ul className="space-y-1.5">
                    {msg.recommendations.map((r, j) => {
                      const key = `${i}-${j}`;
                      const done = checkedItems.has(key);
                      return (
                        <li key={j}>
                          <button
                            onClick={() => toggleCheckItem(i, j)}
                            className="text-xs text-steel-200 flex items-start gap-2 w-full text-left hover:text-white transition-colors"
                          >
                            {done
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-risk-low shrink-0 mt-0.5" />
                              : <Circle className="w-3.5 h-3.5 text-steel-500 shrink-0 mt-0.5" />
                            }
                            <span className={done ? "line-through text-steel-500" : ""}>{r}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-panel-border/50">
                  <p className="text-[10px] text-steel-500 mb-1">Source References:</p>
                  <div className="flex flex-wrap gap-1">
                    {msg.sources.map((s, j) => (
                      <span key={j} className="text-[9px] bg-steel-700 text-accent-light px-1.5 py-0.5 rounded font-mono cursor-default" title={s}>
                        {s.length > 40 ? s.slice(0, 40) + "…" : s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons: Copy + Feedback */}
              {msg.role === "assistant" && (
                <div className="mt-3 pt-2 border-t border-panel-border/30 flex items-center gap-2">
                  <button onClick={() => copyToReport(msg.content)} title="Copy to clipboard"
                    className="text-steel-500 hover:text-steel-300 transition-colors flex items-center gap-1 text-[10px]">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                  <span className="text-steel-600">|</span>
                  <button onClick={() => setFeedback(i, "up")}
                    className={`transition-colors flex items-center gap-0.5 text-[10px] ${msg.feedback === "up" ? "text-risk-low" : "text-steel-500 hover:text-steel-300"}`}>
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => setFeedback(i, "down")}
                    className={`transition-colors flex items-center gap-0.5 text-[10px] ${msg.feedback === "down" ? "text-risk-high" : "text-steel-500 hover:text-steel-300"}`}>
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-steel-700 border border-panel-border flex items-center justify-center shrink-0 mt-1">
                <User className="w-3.5 h-3.5 text-steel-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
              <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
            </div>
            <div className="bg-steel-800 border border-panel-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-steel-400">
                <span className="animate-pulse">Analyzing with 9-layer ML pipeline</span>
                <span className="flex gap-0.5">
                  {[0,1,2].map((d) => <span key={d} className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: `${d*150}ms` }} />)}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-panel-border">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about equipment maintenance, failures, or planning..."
            className="flex-1 bg-steel-800 border border-panel-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/40 transition-colors placeholder:text-steel-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary rounded-xl px-5"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
