"use client";
import React, { useState } from "react";

interface TactileSandboxCardProps {
  title: string;
  practiceProblem: string;
  stepByStepHint: string;
  percentage: number;
  isDominant?: boolean;
}

export default function TactileSandboxCard({
  title,
  practiceProblem,
  stepByStepHint,
  percentage,
  isDominant = false,
}: TactileSandboxCardProps) {
  const [userAttempt, setUserAttempt] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className={`rounded-xl border p-6 shadow-sm transition-all ${isDominant ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-200" : "border-slate-200 bg-white"}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">Tactile • {percentage}%</span>
          {isDominant && <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">Primary Match</span>}
        </div>
        <span className="text-xs font-medium text-slate-500">Active Recall Drill</span>
      </div>
      <h3 className="mb-3 text-lg font-bold text-slate-900">{title}</h3>
      <div className="mb-4 rounded-lg border border-emerald-200 bg-white p-4 text-sm text-slate-800">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">Hands-On Challenge</p>
        <p className="whitespace-pre-line font-medium">{practiceProblem}</p>
      </div>
      <div className="mb-4">
        <label htmlFor="tactile-scratchpad" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Your Working Scratchpad (Attempt before revealing)</label>
        <textarea
          id="tactile-scratchpad"
          rows={3}
          maxLength={1000}
          value={userAttempt}
          onChange={(e) => setUserAttempt(e.target.value)}
          placeholder="Write your equations, code steps, or rough logic here..."
          className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setIsRevealed((prev) => !prev)} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700">
          {isRevealed ? "Hide Step-by-Step Breakdown" : userAttempt.trim().length > 0 ? "Check Work & Reveal Solution" : "Reveal Step-by-Step Hint & Solution"}
        </button>
        {userAttempt.trim().length > 0 && !isRevealed && <span className="text-xs font-medium text-emerald-700">✓ Attempt logged ({userAttempt.trim().length} chars)</span>}
      </div>
      {isRevealed && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-900 p-4 text-sm text-slate-100">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">Step-by-Step Walkthrough & Solution</p>
          <p className="whitespace-pre-line leading-relaxed text-slate-200">{stepByStepHint}</p>
        </div>
      )}
    </div>
  );
}
