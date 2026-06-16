"use client";

import { useEffect, useState, useRef } from "react";
import { api, type KnowledgeDocument } from "@/services/api";
import { BookOpen, Search, Loader2, Upload, Trash2, RefreshCw } from "lucide-react";

const DOC_TYPES = ["manual", "sop", "failure_report", "maintenance_record"];

export default function KnowledgePage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ technical_guidance: string; relevant_documents: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [docType, setDocType] = useState("manual");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadDocs = () => {
    api.getKnowledgeDocuments().then(setDocuments).catch(() => {});
    api.getKnowledgeStats().then(setStats).catch(() => {});
  };

  useEffect(() => { loadDocs(); }, []);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await api.knowledgeQuery(query);
      setResult(data);
    } catch {
      setResult({ technical_guidance: "Knowledge base unavailable. Connect backend to enable RAG retrieval.", relevant_documents: [] });
    } finally {
      setLoading(false);
    }
  };

  const upload = async (file: File) => {
    await api.uploadKnowledgeDocument(file, docType);
    loadDocs();
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-accent" />
          </div>
          <h1 className="page-title">Knowledge Center</h1>
        </div>
        <p className="page-subtitle ml-11">RAG-powered search, document management, and Qdrant embeddings</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="card-hover text-center py-3">
            <p className="kpi-value text-accent">{String(stats.total_documents)}</p>
            <p className="text-[10px] text-steel-400 mt-1">Documents</p>
          </div>
          <div className="card-hover text-center py-3">
            <p className="kpi-value text-risk-low">{String(stats.indexed_documents)}</p>
            <p className="text-[10px] text-steel-400 mt-1">Indexed</p>
          </div>
          <div className="card-hover text-center py-3">
            <p className="text-xs font-medium text-steel-200">{String(stats.embedding_model)}</p>
            <p className="text-[10px] text-steel-400 mt-1">Embedding Model</p>
          </div>
          <div className="card-hover text-center py-3">
            <p className="text-xs font-medium text-steel-200">{String(stats.vector_store)}</p>
            <p className="text-[10px] text-steel-400 mt-1">Vector Store</p>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Search SOP, fault code, equipment procedure..."
              className="input-field w-full pl-10"
            />
          </div>
          <button type="button" onClick={search} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </button>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="font-semibold mb-3">Technical Guidance</h3>
            <p className="text-sm text-steel-200 leading-relaxed whitespace-pre-wrap">{result.technical_guidance}</p>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-3">Relevant Documents</h3>
            <ul className="space-y-2">
              {(result.relevant_documents.length ? result.relevant_documents : ["No documents indexed yet"]).map((doc) => (
                <li key={doc} className="text-sm p-2 rounded bg-steel-800 border border-panel-border">{doc}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-accent" /> Document Library</h3>
          <div className="flex items-center gap-2">
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className="input-field text-xs py-1">
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary flex items-center gap-1 text-xs">
              <Upload className="w-3.5 h-3.5" /> Upload
            </button>
            <button type="button" onClick={() => api.reindexKnowledge().then(loadDocs)} className="btn-secondary flex items-center gap-1 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Reindex
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </div>
        </div>
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-steel-800/50 border border-panel-border">
              <div>
                <p className="text-sm font-medium">{doc.filename}</p>
                <p className="text-[10px] text-steel-400">{doc.doc_type} · {doc.equipment_id || "plant-wide"} · {doc.indexed ? "indexed" : "pending"}</p>
              </div>
              <button type="button" onClick={() => api.deleteKnowledgeDocument(doc.id).then(loadDocs)} className="text-steel-500 hover:text-risk-critical" aria-label={`Delete document ${doc.filename}`}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
