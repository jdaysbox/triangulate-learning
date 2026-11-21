import React from "react";

/**
 * Flow chart renderer. Source format, one edge chain per line:
 *   Step A -> Step B : optional edge label
 *   Step A -> Step B -> Step C
 * Lines without an arrow are shown as notes. Legacy ASCII art (|, +---, v) and anything
 * unparseable falls back to a plain <pre>, so this never makes a diagram worse.
 */

interface Edge {
  from: string;
  to: string;
  label?: string;
}
interface Placed {
  id: string;
  lines: string[];
  w: number;
  h: number;
  layer: number;
  x: number; // center
  y: number; // top
  hasIn: boolean;
}

const ARROW = /\s*(?:->|→)\s*/;
const clean = (s: string) => s.trim().replace(/^[\[("'`]+|[\])"'`]+$/g, "").trim() || s.trim();

export function parseFlow(src: string): { edges: Edge[]; nodes: string[]; notes: string[] } | null {
  const lines = src.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.some((l) => /^[|v^+=_\-\s]+$/.test(l) || l.includes("+--"))) return null; // legacy ASCII art
  const edges: Edge[] = [];
  const nodes: string[] = [];
  const notes: string[] = [];
  const add = (n: string) => {
    if (!nodes.includes(n)) nodes.push(n);
  };
  for (const line of lines) {
    if (!ARROW.test(line)) {
      notes.push(line);
      continue;
    }
    let body = line;
    let label: string | undefined;
    const k = line.lastIndexOf(" : ");
    if (k > -1) {
      body = line.slice(0, k);
      label = line.slice(k + 3).trim() || undefined;
    }
    const parts = body.split(ARROW).map(clean).filter(Boolean);
    if (parts.length < 2) {
      notes.push(line);
      continue;
    }
    parts.forEach(add);
    for (let i = 0; i < parts.length - 1; i++) {
      edges.push({ from: parts[i], to: parts[i + 1], label: i === parts.length - 2 ? label : undefined });
    }
  }
  return edges.length && nodes.length <= 24 ? { edges, nodes, notes } : null;
}

function wrap(text: string, max = 22): string[] {
  const out: string[] = [];
  let cur = "";
  for (const word of text.split(/\s+/)) {
    if (cur && (cur + " " + word).length > max) {
      out.push(cur);
      cur = word;
    } else cur = cur ? cur + " " + word : word;
  }
  if (cur) out.push(cur);
  return out.slice(0, 4);
}

function layout(nodes: string[], edges: Edge[]) {
  const n = nodes.length;
  const layer: Record<string, number> = Object.fromEntries(nodes.map((id) => [id, 0]));
  for (let it = 0; it < n; it++) {
    let changed = false;
    for (const e of edges) {
      if (e.from !== e.to && layer[e.to] < layer[e.from] + 1 && layer[e.from] + 1 < n) {
        layer[e.to] = layer[e.from] + 1;
        changed = true;
      }
    }
    if (!changed) break;
  }
  const hasIn = new Set(edges.filter((e) => layer[e.to] > layer[e.from]).map((e) => e.to));
  const byId: Record<string, Placed> = {};
  for (const id of nodes) {
    const lines = wrap(id);
    const longest = Math.max(...lines.map((l) => l.length));
    byId[id] = {
      id,
      lines,
      w: Math.min(190, Math.max(86, longest * 7 + 30)),
      h: lines.length * 16 + 20,
      layer: layer[id],
      x: 0,
      y: 0,
      hasIn: hasIn.has(id),
    };
  }
  const depth = Math.max(...nodes.map((id) => layer[id]));
  const rows: Placed[][] = Array.from({ length: depth + 1 }, () => []);
  nodes.forEach((id) => rows[layer[id]].push(byId[id]));
  const GAP_X = 26, GAP_Y = 100, PAD = 18;
  const rowW = (r: Placed[]) => r.reduce((s, p) => s + p.w, 0) + GAP_X * Math.max(0, r.length - 1);
  const maxW = Math.max(...rows.map(rowW));
  let y = PAD;
  rows.forEach((row, li) => {
    if (li > 0) {
      // order by average parent position to reduce crossings
      const key = (p: Placed) => {
        const ps = edges.filter((e) => e.to === p.id && layer[e.from] < li).map((e) => byId[e.from].x);
        return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : maxW / 2;
      };
      row.sort((a, b) => key(a) - key(b));
    }
    let x = PAD + (maxW - rowW(row)) / 2;
    const rowH = Math.max(...row.map((p) => p.h));
    for (const p of row) {
      p.x = x + p.w / 2;
      p.y = y + (rowH - p.h) / 2;
      x += p.w + GAP_X;
    }
    y += rowH + GAP_Y;
  });
  const back = edges.some((e) => layer[e.to] <= layer[e.from] && e.from !== e.to);
  return { byId, layer, width: maxW + PAD * 2 + (back ? 44 : 0), height: y - GAP_Y + PAD, maxRight: PAD + maxW };
}

export default function FlowDiagram({ source }: { source: string }) {
  const parsed = parseFlow(source);
  if (!parsed) {
    return (
      <pre className="nm-inset overflow-x-auto p-4 font-mono text-xs leading-snug text-ink">{source}</pre>
    );
  }
  const { edges, nodes, notes } = parsed;
  const { byId, layer, width, height, maxRight } = layout(nodes, edges);
  const summary = edges.map((e) => `${e.from} to ${e.to}${e.label ? ` (${e.label})` : ""}`).join("; ");

  return (
    <div className="nm-inset p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto h-auto w-full" style={{ maxWidth: width }} role="img" aria-label={`Flow chart: ${summary}`}>
        <defs>
          <linearGradient id="fd-node" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e3e4e6" />
            <stop offset="100%" stopColor="#cfd0d2" />
          </linearGradient>
          <linearGradient id="fd-root" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34363c" />
            <stop offset="100%" stopColor="#1e1f22" />
          </linearGradient>
          <filter id="fd-shadow" x="-10%" y="-10%" width="120%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.16" />
          </filter>
          <marker id="fd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 1 L9 5 L0 9 Z" fill="#18191b" />
          </marker>
        </defs>

        {edges.map((e, i) => {
          const a = byId[e.from], b = byId[e.to];
          let d: string, lx: number, ly: number;
          if (e.from === e.to) {
            d = `M ${a.x + a.w / 2} ${a.y + a.h / 2 - 6} C ${a.x + a.w / 2 + 30} ${a.y - 10}, ${a.x + a.w / 2 + 30} ${a.y + a.h + 10}, ${a.x + a.w / 2} ${a.y + a.h / 2 + 6}`;
            lx = a.x + a.w / 2 + 26;
            ly = a.y + a.h / 2;
          } else if (layer[e.to] < layer[e.from]) {
            const rx = maxRight + 30;
            d = `M ${a.x + a.w / 2} ${a.y + a.h / 2} C ${rx} ${a.y + a.h / 2}, ${rx} ${b.y + b.h / 2}, ${b.x + b.w / 2} ${b.y + b.h / 2}`;
            lx = rx - 6;
            ly = (a.y + b.y + a.h / 2 + b.h / 2) / 2;
          } else if (layer[e.to] === layer[e.from]) {
            const left = a.x < b.x;
            const x1 = left ? a.x + a.w / 2 : a.x - a.w / 2;
            const x2 = left ? b.x - b.w / 2 : b.x + b.w / 2;
            d = `M ${x1} ${a.y + a.h / 2} L ${x2} ${b.y + b.h / 2}`;
            lx = (x1 + x2) / 2;
            ly = a.y + a.h / 2 - 8;
          } else {
            const x1 = a.x, y1 = a.y + a.h, x2 = b.x, y2 = b.y;
            const dy = Math.max(24, (y2 - y1) / 2);
            d = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
            const sib = edges.filter((o) => o.from === e.from && layer[o.to] > layer[o.from]);
            const t = sib.length > 1 ? 0.58 + 0.22 * (sib.indexOf(e) % 2) : 0.5; // stagger siblings
            const u = 1 - t;
            lx = u * u * u * x1 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x2;
            ly = u * u * u * y1 + 3 * u * u * t * (y1 + dy) + 3 * u * t * t * (y2 - dy) + t * t * t * y2;
          }
          const ll = e.label ? [e.label.length > 24 ? e.label.slice(0, 23) + "…" : e.label] : [];
          const tw = ll.length ? Math.max(...ll.map((l) => l.length)) * 5.8 + 12 : 0;
          const th = ll.length * 12 + 6;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke="#5e6064" strokeWidth={1.5} strokeLinecap="round" markerEnd="url(#fd-arrow)" />
              {ll.length > 0 && (
                <g>
                  <rect x={lx - tw / 2} y={ly - th / 2} width={tw} height={th} rx={8} fill="#c9cacd" />
                  <text textAnchor="middle" fontSize={10.5} fill="#5e6064">
                    {ll.map((l, i) => (
                      <tspan key={i} x={lx} y={ly + 3.5 + (i - (ll.length - 1) / 2) * 12}>
                        {l}
                      </tspan>
                    ))}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {nodes.map((id) => {
          const p = byId[id];
          const root = !p.hasIn;
          return (
            <g key={id} filter="url(#fd-shadow)">
              <rect
                x={p.x - p.w / 2}
                y={p.y}
                width={p.w}
                height={p.h}
                rx={10}
                fill={root ? "url(#fd-root)" : "url(#fd-node)"}
                stroke={root ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.7)"}
                strokeWidth={1}
              />
              <text textAnchor="middle" fontSize={12} fontWeight={500} fill={root ? "#f2f3f4" : "#18191b"}>
                {p.lines.map((l, i) => (
                  <tspan key={i} x={p.x} y={p.y + p.h / 2 + 4 + (i - (p.lines.length - 1) / 2) * 16}>
                    {l}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
      {notes.length > 0 && (
        <ul className="mt-2 space-y-0.5 px-1 text-[12px] text-ink-2">
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
