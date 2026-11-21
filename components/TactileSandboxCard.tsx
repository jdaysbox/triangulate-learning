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
    <div className={`nm-card nm-crop p-6 ${isDominant ? "nm-card-primary" : ""}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="nm-badge border border-white/40 bg-[#c9cacd] uppercase tracking-wide text-ink">Tactile • {percentage}%</span>
          {isDominant && <span className="nm-badge bg-obsidian text-white">Primary Match</span>}
        </div>
        <span className="nm-micro">Active Recall Drill</span>
      </div>
      <h3 className="mb-3 text-[20px] font-medium tracking-[-0.01em] text-ink">{title}</h3>
      <div className="nm-inset mb-4 p-4 text-[13px] text-ink">
        <p className="nm-micro mb-1">Hands-On Challenge</p>
        <p className="whitespace-pre-line font-medium">{practiceProblem}</p>
      </div>
      <div className="mb-4">
        <label htmlFor="tactile-scratchpad" className="nm-micro mb-1.5 block">Your Working Scratchpad (Attempt before revealing)</label>
        <textarea
          id="tactile-scratchpad"
          rows={3}
          maxLength={1000}
          value={userAttempt}
          onChange={(e) => setUserAttempt(e.target.value)}
          placeholder="Write your equations, code steps, or rough logic here..."
          className="nm-field font-mono text-[13px]"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setIsRevealed((prev) => !prev)} className="nm-dark px-4 py-2 text-xs">
          {isRevealed ? "Hide Step-by-Step Breakdown" : userAttempt.trim().length > 0 ? "Check Work & Reveal Solution" : "Reveal Step-by-Step Hint & Solution"}
        </button>
        {userAttempt.trim().length > 0 && !isRevealed && <span className="text-xs font-medium text-pos">✓ Attempt logged ({userAttempt.trim().length} chars)</span>}
      </div>
      {isRevealed && (
        <div className="mt-4 rounded-xl bg-obsidian p-4 text-[13px] text-slate-100 shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#9fa2a6]">Step-by-Step Walkthrough & Solution</p>
          <p className="whitespace-pre-line leading-relaxed text-slate-200">{stepByStepHint}</p>
        </div>
      )}
    </div>
  );
}
