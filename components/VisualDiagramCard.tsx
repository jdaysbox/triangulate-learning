import MathText from "./MathText";
import FlowDiagram from "./FlowDiagram";

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
    <div className={`nm-card nm-crop p-6 ${isDominant ? "nm-card-primary" : ""}`}>
      <div className="mb-4 flex items-center gap-2">
        <span className="nm-badge border border-white/40 bg-[#c9cacd] uppercase tracking-wide text-ink">Visual • {percentage}%</span>
        {isDominant && <span className="nm-badge bg-obsidian text-white">Primary Match</span>}
      </div>
      <h3 className="mb-3 text-[20px] font-medium tracking-[-0.01em] text-ink">{title}</h3>
      {asciiDiagram && (
        <div className="mb-4">
          <p className="nm-micro mb-1">Concept Diagram</p>
          <FlowDiagram source={asciiDiagram} />
        </div>
      )}
      {keyTable && (
        <div>
          <p className="nm-micro mb-1">Key Terms &amp; Equations</p>
          {rows ? (
            <div className="nm-inset overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-black/10 text-[11px] font-medium uppercase tracking-wide text-ink-3">
                  <tr>
                    {rows[0].map((h, i) => (
                      <th key={i} className="px-4 py-3"><MathText text={h} /></th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {rows.slice(1).map((r, i) => (
                    <tr key={i} className="transition hover:bg-white/30">
                      {r.map((c, j) => (
                        <td key={j} className={`px-4 py-3 ${j === 0 ? "font-medium text-ink" : "text-ink-2"}`}>
                          <MathText text={c} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <pre className="nm-inset overflow-x-auto p-4 font-mono text-xs leading-snug text-ink">{keyTable}</pre>
          )}
        </div>
      )}
    </div>
  );
}
