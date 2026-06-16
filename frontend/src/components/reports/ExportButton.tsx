interface ExportButtonProps {
  content: string;
  filename: string;
}

export default function ExportButton({ content, filename }: ExportButtonProps) {
  const download = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={download} className="text-sm px-3 py-1.5 rounded-lg border border-steel-500/30 hover:border-accent/50">
      Export
    </button>
  );
}
