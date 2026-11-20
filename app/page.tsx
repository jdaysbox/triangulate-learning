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
        { key: "visual", label: "Visual", pct: profile.visual_pct, color: "bg-sky-500" },
        { key: "auditory", label: "Auditory", pct: profile.auditory_pct, color: "bg-purple-500" },
        { key: "tactile", label: "Tactile", pct: profile.tactile_pct, color: "bg-emerald-500" },
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10">
        <header>
          <p className="text-xs font-bold uppercase tracking-widest text-sky-700">NAE Grand Challenge: Advance Personalized Learning</p>
          <h1 className="mt-1 text-3xl font-bold">Triangulate: Study Material, Your Way</h1>
          <p className="mt-2 text-sm text-slate-600">
            Take a 2-minute habit assessment, then turn dense lecture notes into visual, audio, and hands-on study formats weighted to how you learn.
          </p>
        </header>

        <div role="note" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>AI Check / Limitations:</strong> AI-generated content can contain errors. Always verify technical derivations, formulas, and
          definitions against your syllabus, textbook, and instructor. Learning-style results are a study aid, not a diagnosis.
        </div>

        {/* PART 1 */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold">Part 1: Learning Habit Assessment</h2>
            <button
              type="button"
              onClick={() => {
                setAnswers(SAMPLE_ANSWERS);
                setQ6(SAMPLE_Q6);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Load Sample Student Profile
            </button>
          </div>
          <form onSubmit={submitAssessment} className="space-y-6">
            {QUESTIONS.map((item, i) => (
              <fieldset key={i} className="space-y-2">
                <legend className="mb-1 text-sm font-semibold">
                  Q{i + 1}. {item.q}
                </legend>
                {[...item.opts.map((o, j) => ({ label: o, val: (["V", "A", "T"] as const)[j] })), { label: "Other (describe your habit)", val: "O" as const }].map((o) => (
                  <label key={o.val} className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                    <input
                      type="radio"
                      name={`q${i}`}
                      className="mt-1"
                      checked={answers[i].choice === o.val}
                      onChange={() => setAnswer(i, { choice: o.val })}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
                {answers[i].choice === "O" && (
                  <input
                    type="text"
                    maxLength={150}
                    value={answers[i].other}
                    onChange={(e) => setAnswer(i, { other: e.target.value })}
                    placeholder="Describe what you actually do..."
                    aria-label={`Q${i + 1} custom habit`}
                    className="ml-6 w-[calc(100%-1.5rem)] rounded-lg border border-slate-300 p-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                )}
              </fieldset>
            ))}
            <div>
              <label htmlFor="q6" className="mb-1 block text-sm font-semibold">
                Q6. Describe your worst study habit or the exact moment you usually zone out when studying for a tough class.
              </label>
              <textarea
                id="q6"
                rows={3}
                maxLength={400}
                value={q6}
                onChange={(e) => setQ6(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <p className="mt-1 text-right text-xs text-slate-400">{q6.length}/400</p>
            </div>
            <button
              type="submit"
              disabled={assessing}
              className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-60"
            >
              {assessing ? "Analyzing..." : "Analyze My Learning Profile"}
            </button>
            {assessError && <p role="alert" className="text-sm text-rose-700">{assessError}</p>}
          </form>

          {profile && (
            <div className="mt-8 space-y-4 border-t border-slate-200 pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-bold">Your Profile</h3>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{profile.learning_archetype}</span>
              </div>
              <div className="space-y-2">
                {bars.map((b) => (
                  <div key={b.key}>
                    <div className="mb-0.5 flex justify-between text-xs font-semibold text-slate-700">
                      <span>{b.label}</span>
                      <span>{b.pct}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full ${b.color} transition-all`} style={{ width: `${b.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {profile.habit_diagnosis.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
              {profile.input_warnings && (
                <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">⚠ {profile.input_warnings}</p>
              )}
            </div>
          )}
        </section>

        {/* PART 2 */}
        <section className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${profile ? "" : "opacity-60"}`}>
          <h2 className="mb-1 text-xl font-bold">Part 2: Course Material Transformer</h2>
          {!profile && <p className="mb-3 text-sm text-slate-500">Complete Part 1 to unlock this step.</p>}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!profile}
              onClick={() => setMaterial(SAMPLE_NOTES)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Load Sample Lecture Notes
            </button>
            <label className={`rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ${profile ? "cursor-pointer hover:bg-slate-100" : "opacity-50"}`}>
              Upload .txt / .md
              <input type="file" accept=".txt,.md,text/plain,text/markdown" className="hidden" disabled={!profile} onChange={onFile} />
            </label>
          </div>
          {fileMsg && <p className="mb-2 text-xs text-slate-600">{fileMsg}</p>}
          <textarea
            rows={8}
            maxLength={8000}
            disabled={!profile}
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="Paste lecture notes, a transcript, or problems here..."
            aria-label="Course material"
            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-50"
          />
          <p className="mt-1 text-right text-xs text-slate-400">{material.length}/8000</p>
          <button
            type="button"
            disabled={!profile || transforming}
            onClick={submitTransform}
            className="mt-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-60"
          >
            {transforming ? "Transforming (about 5s)..." : "Transform My Material"}
          </button>
          {transformError && <p role="alert" className="mt-2 text-sm text-rose-700">{transformError}</p>}

          {result && profile && (
            <div className="mt-8 space-y-5">
              {result.summary_header && <h3 className="text-lg font-bold">{result.summary_header}</h3>}
              {order.map((key, idx) => renderModule(key, idx))}
              <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <strong>AI Check:</strong> {result.ai_verification_note}
              </p>
            </div>
          )}
        </section>

        <footer className="pb-6 text-center text-xs text-slate-400">
          Prototype for TRIANGULATE. Powered by Claude. {LABELS.join(" / ")} profile is a study aid only.
        </footer>
      </main>
    </div>
  );
}
