interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  recommendations?: string[];
  sources?: string[];
}

export default function ChatMessage({ role, content, recommendations, sources }: ChatMessageProps) {
  return (
    <div className={`max-w-[80%] rounded-xl p-4 ${role === "user" ? "bg-accent/20 ml-auto" : "card"}`}>
      <p className="text-sm whitespace-pre-wrap">{content}</p>
      {recommendations && recommendations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-steel-500/30">
          <p className="text-xs font-semibold text-accent mb-1">Recommendations:</p>
          <ul className="text-xs space-y-1">
            {recommendations.map((r, j) => (
              <li key={j}>• {r}</li>
            ))}
          </ul>
        </div>
      )}
      {sources && sources.length > 0 && (
        <p className="text-xs text-steel-100 mt-2">Sources: {sources.join(", ")}</p>
      )}
    </div>
  );
}
