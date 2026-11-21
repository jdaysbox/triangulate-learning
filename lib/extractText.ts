// Client-side text extraction (runs in the browser, so nothing heavy runs on the server).
const MAX_CHARS = 8000;

const decode = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");

async function fromPptx(file: File): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slides = Object.keys(zip.files)
    .map((name) => ({ name, n: Number(/^ppt\/slides\/slide(\d+)\.xml$/.exec(name)?.[1]) }))
    .filter((s) => !Number.isNaN(s.n))
    .sort((a, b) => a.n - b.n);
  if (slides.length === 0) throw new Error("No slides found in that file.");
  const out: string[] = [];
  for (const s of slides) {
    const xml = await zip.files[s.name].async("string");
    // One line per paragraph (<a:p>), joining its text runs (<a:t>).
    const lines = xml
      .split("</a:p>")
      .map((p) => [...p.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)].map((m) => decode(m[1])).join(""))
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length) out.push(`Slide ${s.n}:\n${lines.join("\n")}`);
    if (out.join("\n\n").length > MAX_CHARS) break;
  }
  return out.join("\n\n");
}

async function fromPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const out: string[] = [];
  let total = 0;
  for (let i = 1; i <= pdf.numPages && total <= MAX_CHARS; i++) {
    const content = await (await pdf.getPage(i)).getTextContent();
    const text = content.items
      .map((it) => ("str" in it ? it.str + ("hasEOL" in it && it.hasEOL ? "\n" : " ") : ""))
      .join("")
      .replace(/[ \t]+/g, " ")
      .trim();
    if (text) {
      out.push(`Page ${i}:\n${text}`);
      total += text.length;
    }
  }
  return out.join("\n\n");
}

/** Returns the file's text, or throws an Error whose message is safe to show the student. */
export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  let text: string;
  if (name.endsWith(".txt") || name.endsWith(".md")) {
    text = await file.text();
  } else if (name.endsWith(".pptx")) {
    text = await fromPptx(file);
  } else if (name.endsWith(".pdf")) {
    text = await fromPdf(file);
  } else if (name.endsWith(".ppt") || name.endsWith(".docx") || name.endsWith(".doc")) {
    throw new Error("Old .ppt and Word files aren't supported. Save slides as .pptx or PDF, or paste the text.");
  } else {
    throw new Error("Supported files: .txt, .md, .pdf, .pptx. Otherwise, paste the text.");
  }
  text = text.trim();
  if (!text) {
    throw new Error("No selectable text found (scanned or image-only file?). Please paste the text instead.");
  }
  return text;
}

export { MAX_CHARS };
