interface VisualDiagramCardProps {
  title: string;
  asciiDiagram: string;
  keyTable: string;
  percentage: number;
  isDominant?: boolean;
}

export default function VisualDiagramCard({
  title,
  asciiDiagram,
  keyTable,
  percentage,
  isDominant = false,
}: VisualDiagramCardProps) {
  return (
    <div className={`rounded-xl border p-6 shadow-sm transition-all ${isDominant ? "border-sky-500 bg-sky-50/40 ring-2 ring-sky-200" : "border-slate-200 bg-white"}`}>
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-md bg-sky-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-sky-800">Visual • {percentage}%</span>
        {isDominant && <span className="rounded-full bg-sky-600 px-2.5 py-0.5 text-xs font-semibold text-white">Primary Match</span>}
      </div>
      <h3 className="mb-3 text-lg font-bold text-slate-900">{title}</h3>
      {asciiDiagram && (
        <div className="mb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-sky-700">Concept Diagram</p>
          <pre className="overflow-x-auto rounded-lg border border-sky-100 bg-white p-4 font-mono text-xs leading-snug text-slate-800">{asciiDiagram}</pre>
        </div>
      )}
      {keyTable && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Key Terms Table</p>
          <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-snug text-slate-800">{keyTable}</pre>
        </div>
      )}
    </div>
  );
}
