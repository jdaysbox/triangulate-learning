import MathText from "./MathText";

interface VisualDiagramCardProps {
  title: string;
  asciiDiagram: string;
  keyTable: string;
  percentage: number;
  isDominant?: boolean;
}

/** Parse a "a | b | c" text table into rows. Returns null if it doesn't look like a table. */
function parseTable(text: string): string[][] | null {
  const rows = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.includes("|") && !/^[|\s:-]+$/.test(l))
    .map((l) => l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
  return rows.length >= 2 ? rows : null;
}

export default function VisualDiagramCard({
  title,
  asciiDiagram,
  keyTable,
  percentage,
  isDominant = false,
}: VisualDiagramCardProps) {
  const rows = keyTable ? parseTable(keyTable) : null;
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
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Key Terms &amp; Equations</p>
          {rows ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
                  <tr>
                    {rows[0].map((h, i) => (
                      <th key={i} className="px-4 py-3"><MathText text={h} /></th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.slice(1).map((r, i) => (
                    <tr key={i} className="transition hover:bg-slate-50/80">
                      {r.map((c, j) => (
                        <td key={j} className={`px-4 py-3 ${j === 0 ? "font-semibold text-slate-800" : "text-slate-700"}`}>
                          <MathText text={c} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-snug text-slate-800">{keyTable}</pre>
          )}
        </div>
      )}
    </div>
  );
}
