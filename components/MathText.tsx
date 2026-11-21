"use client";
import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/** Renders one LaTeX expression. Falls back to the raw text if KaTeX fails. */
export function MathRenderer({ math, block = false }: { math: string; block?: boolean }) {
  let html: string;
  try {
    html = katex.renderToString(math, { displayMode: block, throwOnError: false });
  } catch {
    return <span>{math}</span>;
  }
  return (
    <span
      className={block ? "my-2 block text-center" : "inline-block px-0.5"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Renders plain text, turning $...$ segments into KaTeX math. */
export default function MathText({ text }: { text: string }) {
  const parts = text.split(/\$([^$\n]+)\$/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <MathRenderer key={i} math={part} /> : <React.Fragment key={i}>{part}</React.Fragment>,
      )}
    </>
  );
}
