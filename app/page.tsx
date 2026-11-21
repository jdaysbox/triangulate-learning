"use client";
import { useState } from "react";
import AuditoryPodcastCard from "@/components/AuditoryPodcastCard";
import TactileSandboxCard from "@/components/TactileSandboxCard";
import VisualDiagramCard from "@/components/VisualDiagramCard";
import type { Profile } from "@/app/api/assess/route";
import type { Transformed } from "@/app/api/transform/route";

type Choice = "V" | "A" | "T" | "O" | "";
interface Answer {
  choice: Choice;
  other: string;
}

const QUESTIONS: { q: string; opts: [string, string, string] }[] = [
  {
    q: "Stuck on a brutal homework problem at 11 PM?",
    opts: [
      "Draw a free-body diagram / flowchart, or color-code variables",
      "Read it out loud or talk it through in a study group",
      "Plug in dummy numbers, test edge cases, or mimic a worked example",
    ],
  },
  {
    q: "Your professor drops a dense, 60-slide deck before an exam?",
    opts: [
      "Condense into a single-page mind map, spatial table, or annotated diagram",
      "Re-watch the lecture at 1.5x or explain it out loud",
      "Skip straight to past exam problems",
    ],
  },
  {
    q: "Learning a new software tool, lab instrument, or coding library?",
    opts: [
      "Architecture diagram / visual cheat sheet",
      "Narrated walkthrough video",
      "Open a blank sandbox and learn by trial and error",
    ],
  },
  {
    q: "What keeps your brain locked in during a live lecture?",
    opts: [
      "Watching live graphs, derivations, or color-coded board work",
      "Verbal analogies, stories, and Q&A",
      "Working in-class problems, writing physical notes, or lab demos",
    ],
  },
  {
    q: "Right before walking into an exam, how do you verify recall?",
    opts: [
      "Picture where formulas/graphs sit on my study sheet",
      "Recite definitions, formulas, or mnemonics under my breath",
      "Do one cold practice problem from scratch",
    ],
  },
];

const SAMPLE_ANSWERS: Answer[] = [
  { choice: "V", other: "" },
  { choice: "V", other: "" },
  { choice: "T", other: "" },
  { choice: "V", other: "" },
  { choice: "A", other: "" },
];
const SAMPLE_Q6 =
  "I zone out when a derivation runs past 10 steps on the board. I copy it down without understanding and only realize later that I can't redo it.";

const SAMPLE_NOTES = `Thermodynamics: First Law and Heat Engines
The first law states that the change in internal energy of a system equals heat added minus work done by the system: dU = Q - W. For an ideal gas undergoing an isothermal process, dU = 0, so Q = W. In an adiabatic process, Q = 0 so dU = -W.
A heat engine takes heat Qh from a hot reservoir, converts part into work W, and rejects Qc to a cold reservoir. Efficiency = W/Qh = 1 - Qc/Qh. The Carnot efficiency, the maximum possible, is 1 - Tc/Th with temperatures in Kelvin.
Example: an engine operates between 500 K and 300 K. Its maximum efficiency is 1 - 300/500 = 40%. If it absorbs 1000 J per cycle, the maximum work is 400 J.`;

const emptyAnswers = (): Answer[] => QUESTIONS.map(() => ({ choice: "", other: "" }));

const LABELS = ["Visual", "Auditory", "Tactile"];

export default function Home() {
  const [answers, setAnswers] = useState<Answer[]>(emptyAnswers());
  const [q6, setQ6] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assessing, setAssessing] = useState(false);
  const [assessError, setAssessError] = useState("");

  const [material, setMaterial] = useState("");
  const [fileMsg, setFileMsg] = useState("");
  const [result, setResult] = useState<Transformed | null>(null);
  const [transforming, setTransforming] = useState(false);
  const [transformError, setTransformError] = useState("");

  const setAnswer = (i: number, patch: Partial<Answer>) =>
    setAnswers((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));

  async function postJson<T>(url: string, body: unknown): Promise<T> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      return data as T;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") throw new Error("Request timed out. Please try again.");
      throw e instanceof Error ? e : new Error("Network error.");
    } finally {
      clearTimeout(timer);
    }
  }

  async function submitAssessment(e: React.FormEvent) {
    e.preventDefault();
    setAssessError("");
    setAssessing(true);
    try {
      const p = await postJson<Profile>("/api/assess", { answers, q6 });
      setProfile(p);
      setResult(null);
    } catch (err) {
      setAssessError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setAssessing(false);
    }
  }

  async function submitTransform() {
    setTransformError("");
    if (!profile) return;
    if (material.trim().length < 30) {
      setTransformError("Please paste at least 30 characters of lecture notes or problems.");
      return;
    }
    setTransforming(true);
    try {
      const r = await postJson<Transformed>("/api/transform", { profile, courseMaterial: material });
      setResult(r);
    } catch (err) {
      setTransformError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setTransforming(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    setFileMsg("");
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".txt") && !name.endsWith(".md")) {
      setFileMsg("Only .txt and .md files are supported. For PDFs or Word docs, please copy and paste the text instead.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setMaterial(text.slice(0, 8000));
      setFileMsg(text.length > 8000 ? "File was longer than 8,000 characters and was truncated." : `Loaded ${file.name}.`);
    };
    reader.onerror = () => setFileMsg("Could not read that file. Try pasting the text instead.");
    reader.readAsText(file);
  }

  const bars = profile
    ? [
        { key: "visual", label: "Visual", pct: profile.visual_pct, fill: "#1e1f22" },
        { key: "auditory", label: "Auditory", pct: profile.auditory_pct, fill: "#5e6064" },
        { key: "tactile", label: "Tactile", pct: profile.tactile_pct, fill: "#8a8d91" },
      ]
    : [];

  const order = profile
    ? [...bars].sort((a, b) => b.pct - a.pct).map((b) => b.key)
    : [];

  function renderModule(key: string, idx: number) {
    if (!result || !profile) return null;
    const dominant = idx === 0;
    if (key === "visual")
      return (
        <VisualDiagramCard
          key={key}
          title={result.visual_module.title}
          asciiDiagram={result.visual_module.ascii_diagram}
          keyTable={result.visual_module.key_table}
          percentage={profile.visual_pct}
          isDominant={dominant}
        />
      );
    if (key === "auditory")
      return (
        <AuditoryPodcastCard
          key={key}
          title={result.auditory_module.title}
          podcastScript={result.auditory_module.podcast_script}
          mnemonics={result.auditory_module.mnemonics}
          percentage={profile.auditory_pct}
          isDominant={dominant}
        />
      );
    return (
      <TactileSandboxCard
        key={key}
        title={result.tactile_module.title}
        practiceProblem={result.tactile_module.practice_problem}
        stepByStepHint={result.tactile_module.step_by_step_hint}
        percentage={profile.tactile_pct}
        isDominant={dominant}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-5 p-3 md:p-6">
      <Rail />
      <main className="nm-window min-w-0 flex-1 space-y-8 p-5 md:p-8">
        <header>
          <p className="nm-micro">NAE Grand Challenge · Advance Personalized Learning</p>
          <h1 className="mt-1 text-[28px] font-medium tracking-[-0.02em] text-ink">Triangulate: Study Material, Your Way</h1>
          <p className="mt-2 max-w-2xl text-[14px] text-ink-2">
            Take a 2-minute habit assessment, then turn dense lecture notes into visual, audio, and hands-on study formats weighted to how you learn.
          </p>
        </header>

        <div id="limits" role="note" className="nm-inset flex gap-3 p-4 text-[13px] text-ink-2">
          <Icon d="M12 9v4m0 4h.01M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" className="mt-0.5 h-5 w-5 shrink-0 text-ink" />
          <p>
            <strong className="font-medium text-ink">AI Check / Limitations:</strong> AI-generated content can contain errors. Always verify technical
            derivations, formulas, and definitions against your syllabus, textbook, and instructor. Learning-style results are a study aid, not a diagnosis.
          </p>
        </div>

        {/* PART 1 */}
        <section id="assess" className="nm-card nm-crop p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[20px] font-medium tracking-[-0.01em]">Part 1: Learning Habit Assessment</h2>
            <button
              type="button"
              onClick={() => {
                setAnswers(SAMPLE_ANSWERS);
                setQ6(SAMPLE_Q6);
              }}
              className="nm-pill px-3.5 py-2 text-[13px]"
            >
              Load Sample Student Profile
            </button>
          </div>
          <form onSubmit={submitAssessment} className="space-y-6">
            {QUESTIONS.map((item, i) => (
              <fieldset key={i} className="space-y-1.5">
                <legend className="mb-2 text-[14px] font-medium text-ink">
                  <span className="mr-1.5 text-ink-3">Q{i + 1}</span>
                  {item.q}
                </legend>
                {[...item.opts.map((o, j) => ({ label: o, val: (["V", "A", "T"] as const)[j] })), { label: "Other (describe your habit)", val: "O" as const }].map((o) => {
                  const selected = answers[i].choice === o.val;
                  return (
                    <label
                      key={o.val}
                      className={`flex cursor-pointer items-start gap-2.5 px-3 py-2 text-[13px] transition ${selected ? "nm-pill" : "rounded-[10px] border border-transparent text-ink-2 hover:bg-white/30"}`}
                    >
                      <input
                        type="radio"
                        name={`q${i}`}
                        className="mt-0.5 accent-[#1e1f22]"
                        checked={selected}
                        onChange={() => setAnswer(i, { choice: o.val })}
                      />
                      <span>{o.label}</span>
                    </label>
                  );
                })}
                {answers[i].choice === "O" && (
                  <input
                    type="text"
                    maxLength={150}
                    value={answers[i].other}
                    onChange={(e) => setAnswer(i, { other: e.target.value })}
                    placeholder="Describe what you actually do..."
                    aria-label={`Q${i + 1} custom habit`}
                    className="nm-field ml-7 !w-[calc(100%-1.75rem)] text-[13px]"
                  />
                )}
              </fieldset>
            ))}
            <div className="nm-groove" />
            <div>
              <label htmlFor="q6" className="mb-2 block text-[14px] font-medium text-ink">
                <span className="mr-1.5 text-ink-3">Q6</span>
                Describe your worst study habit or the exact moment you usually zone out when studying for a tough class.
              </label>
              <textarea
                id="q6"
                rows={3}
                maxLength={400}
                value={q6}
                onChange={(e) => setQ6(e.target.value)}
                className="nm-field text-[13px]"
              />
              <p className="mt-1 text-right text-[11px] text-ink-3 tabular-nums">{q6.length}/400</p>
            </div>
            <button type="submit" disabled={assessing} className="nm-dark px-5 py-2.5 text-[13px]">
              {assessing ? "Analyzing..." : "Analyze My Learning Profile →"}
            </button>
            {assessError && <p role="alert" className="text-[13px] text-[#9a4a44]">{assessError}</p>}
          </form>

          {profile && (
            <div className="mt-8 space-y-5">
              <div className="nm-groove" />
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-[20px] font-medium tracking-[-0.01em]">Your Profile</h3>
                <span className="nm-badge bg-obsidian text-white">{profile.learning_archetype}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {bars.map((b) => (
                  <div key={b.key} className="nm-inset p-4">
                    <p className="nm-micro">{b.label}</p>
                    <p className="mt-2">
                      <span className="nm-kpi">{b.pct}</span>
                      <span className="ml-0.5 text-xl font-light text-ink-3">%</span>
                    </p>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#b6b7ba] shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)]">
                      <div className="h-full rounded-full transition-all" style={{ width: `${b.pct}%`, background: b.fill }} />
                    </div>
                  </div>
                ))}
              </div>
              <ul className="list-disc space-y-1.5 pl-5 text-[13px] text-ink-2">
                {profile.habit_diagnosis.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
              {profile.input_warnings && (
                <p className="nm-inset border-l-2 !border-l-[#d9bd84] p-3 text-[13px] text-ink-2">Note: {profile.input_warnings}</p>
              )}
            </div>
          )}
        </section>

        {/* PART 2 */}
        <section id="transform" className={`nm-card nm-crop p-6 ${profile ? "" : "opacity-70"}`}>
          <h2 className="mb-1 text-[20px] font-medium tracking-[-0.01em]">Part 2: Course Material Transformer</h2>
          {!profile && <p className="mb-3 text-[13px] text-ink-3">Complete Part 1 to unlock this step.</p>}
          <div className="mb-3 mt-3 flex flex-wrap items-center gap-2">
            <button type="button" disabled={!profile} onClick={() => setMaterial(SAMPLE_NOTES)} className="nm-pill px-3.5 py-2 text-[13px]">
              Load Sample Lecture Notes
            </button>
            <label className={`nm-pill px-3.5 py-2 text-[13px] ${profile ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
              Upload .txt / .md
              <input type="file" accept=".txt,.md,text/plain,text/markdown" className="hidden" disabled={!profile} onChange={onFile} />
            </label>
          </div>
          {fileMsg && <p className="mb-2 text-[12px] text-ink-2">{fileMsg}</p>}
          <textarea
            rows={8}
            maxLength={8000}
            disabled={!profile}
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="Paste lecture notes, a transcript, or problems here..."
            aria-label="Course material"
            className="nm-field text-[13px]"
          />
          <p className="mt-1 text-right text-[11px] text-ink-3 tabular-nums">{material.length}/8000</p>
          <button type="button" disabled={!profile || transforming} onClick={submitTransform} className="nm-dark mt-2 px-5 py-2.5 text-[13px]">
            {transforming ? "Transforming (about 5s)..." : "Transform My Material →"}
          </button>
          {transformError && <p role="alert" className="mt-2 text-[13px] text-[#9a4a44]">{transformError}</p>}

          {result && profile && (
            <div className="mt-8 space-y-5">
              <div className="nm-groove" />
              {result.summary_header && <h3 className="text-[20px] font-medium tracking-[-0.01em]">{result.summary_header}</h3>}
              {order.map((key, idx) => renderModule(key, idx))}
              <p className="nm-inset p-3 text-[13px] text-ink-2">
                <strong className="font-medium text-ink">AI Check:</strong> {result.ai_verification_note}
              </p>
            </div>
          )}
        </section>

        <footer className="pb-2 text-center text-[11px] text-ink-3">
          Prototype for TRIANGULATE. Powered by Gemini. {LABELS.join(" / ")} profile is a study aid only.
        </footer>
      </main>
    </div>
  );
}

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** Floating dark icon rail inside a light beveled track (desktop only). */
function Rail() {
  const items = [
    { href: "#assess", label: "Assessment", d: "M9 4h6M9 4a2 2 0 0 0-2 2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1a2 2 0 0 0-2-2M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 14l2 2 4-4" },
    { href: "#transform", label: "Transformer", d: "M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5M3 17.5l9 5 9-5" },
  ];
  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[84px] shrink-0 md:block" aria-label="Sections">
      <div className="nm-inset flex h-full flex-col items-center justify-between rounded-[22px] py-3">
        <nav className="flex w-14 flex-col items-center gap-2 rounded-2xl bg-obsidian p-2 shadow-[0_10px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.12)]">
          {items.map((it, i) => (
            <a
              key={it.href}
              href={it.href}
              title={it.label}
              aria-label={it.label}
              className={`grid h-10 w-10 place-items-center rounded-[10px] text-white transition hover:bg-[#2e3035] ${i === 0 ? "bg-[#2e3035] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" : "text-white/70"}`}
            >
              <Icon d={it.d} />
            </a>
          ))}
        </nav>
        <span
          className="select-none text-[10px] uppercase tracking-[0.15em] text-[#9fa2a6]"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Triangulate 2026 Nav
        </span>
        <div className="flex w-14 flex-col items-center rounded-2xl bg-obsidian p-2 shadow-[0_10px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.12)]">
          <a href="#limits" title="AI Check / Limitations" aria-label="AI Check and limitations" className="grid h-10 w-10 place-items-center rounded-[10px] text-white/70 transition hover:bg-[#2e3035]">
            <Icon d="M12 9v4m0 4h.01M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </a>
        </div>
      </div>
    </aside>
  );
}
