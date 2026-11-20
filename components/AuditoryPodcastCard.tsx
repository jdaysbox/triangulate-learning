"use client";
import React, { useState, useEffect } from "react";

interface AuditoryPodcastCardProps {
  title: string;
  podcastScript: string;
  mnemonics: string[];
  percentage: number;
  isDominant?: boolean;
}

export default function AuditoryPodcastCard({
  title,
  podcastScript,
  mnemonics,
  percentage,
  isDominant = false,
}: AuditoryPodcastCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5>(1);
  const [speechSupported, setSpeechSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeechSupported(false);
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTogglePlay = () => {
    if (!speechSupported) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(podcastScript);
    utterance.rate = playbackRate;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeedChange = (newRate: 1 | 1.5) => {
    setPlaybackRate(newRate);
    if (isSpeaking && speechSupported) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(podcastScript);
      utterance.rate = newRate;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`rounded-xl border p-6 shadow-sm transition-all ${isDominant ? "border-purple-500 bg-purple-50/40 ring-2 ring-purple-200" : "border-slate-200 bg-white"}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-purple-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-purple-800">Auditory • {percentage}%</span>
          {isDominant && <span className="rounded-full bg-purple-600 px-2.5 py-0.5 text-xs font-semibold text-white">Primary Match</span>}
        </div>
        {speechSupported && (
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white text-xs font-medium">
              <button type="button" onClick={() => handleSpeedChange(1)} className={`px-2.5 py-1.5 transition ${playbackRate === 1 ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}>1.0x</button>
              <button type="button" onClick={() => handleSpeedChange(1.5)} className={`px-2.5 py-1.5 transition ${playbackRate === 1.5 ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}>1.5x</button>
            </div>
            <button type="button" onClick={handleTogglePlay} className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition ${isSpeaking ? "bg-rose-600 hover:bg-rose-700" : "bg-purple-600 hover:bg-purple-700"}`}>
              {isSpeaking ? "⏹ Stop Audio" : "▶ Listen to Mini-Podcast"}
            </button>
          </div>
        )}
      </div>
      <h3 className="mb-3 text-lg font-bold text-slate-900">{title}</h3>
      <div className="mb-4 rounded-lg border border-purple-100 bg-white p-4 text-sm leading-relaxed text-slate-700">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-purple-600">Audio Explainer Script</p>
        <p className="whitespace-pre-line">{podcastScript}</p>
      </div>
      {mnemonics && mnemonics.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Verbal Recall Hooks & Mnemonics</p>
          <ul className="space-y-1.5">
            {mnemonics.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-800">
                <span className="font-bold text-purple-600">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
