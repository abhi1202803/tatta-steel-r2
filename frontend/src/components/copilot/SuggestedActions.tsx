interface SuggestedActionsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export default function SuggestedActions({ suggestions, onSelect }: SuggestedActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-6">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="text-xs px-3 py-1.5 rounded-full bg-steel-700 border border-steel-500/30 hover:border-accent/50 transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
