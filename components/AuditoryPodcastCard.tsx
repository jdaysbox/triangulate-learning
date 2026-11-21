"use client";
import React, { useState, useEffect, useRef } from "react";

// Preference order for a natural-sounding English voice (first match wins).
const PREFERRED_VOICES = ["Google US English", "Samantha", "Natural"];

function chooseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  for (const name of PREFERRED_VOICES) {
    const hit = english.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
    if (hit) return hit;
  }
  return (
    english.find((v) => v.lang.toLowerCase() === "en-us" && v.localService === false) ||
    english.find((v) => v.lang.toLowerCase() === "en-us") ||
    english[0] ||
    null
  );
}

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
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const runRef = useRef(0); // identifies the current playback so stale callbacks are ignored

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeechSupported(false);
      return;
    }
    // Voices load asynchronously in Chrome/Edge, so pick again when the list changes.
    const pickVoice = () => {
      voiceRef.current = chooseVoice(window.speechSynthesis.getVoices());
    };
    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
      runRef.current++;
      window.speechSynthesis.cancel();
    };
  }, []);

  // Speak the script sentence by sentence. Chrome's network voices (e.g. Google US English)
  // cut off a single long utterance after ~15 seconds; short chunks avoid that.
  const speak = (rate: number) => {
    const run = ++runRef.current;
    window.speechSynthesis.cancel();
    const chunks = podcastScript.match(/[^.!?\n]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [podcastScript];
    setIsSpeaking(true);
    chunks.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = rate;
      u.pitch = 1.0;
      if (voiceRef.current) {
        u.voice = voiceRef.current;
        u.lang = voiceRef.current.lang;
      } else {
        u.lang = "en-US";
      }
      const done = () => {
        if (runRef.current === run && i === chunks.length - 1) setIsSpeaking(false);
      };
      u.onend = done;
      u.onerror = () => {
        if (runRef.current === run) setIsSpeaking(false);
      };
      window.speechSynthesis.speak(u);
    });
  };

  const handleTogglePlay = () => {
    if (!speechSupported) return;
    if (isSpeaking) {
      runRef.current++;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    speak(playbackRate);
  };

  const handleSpeedChange = (newRate: 1 | 1.5) => {
    setPlaybackRate(newRate);
    if (isSpeaking && speechSupported) speak(newRate);
  };

  return (
    <div className={`nm-card nm-crop p-6 ${isDominant ? "nm-card-primary" : ""}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="nm-badge border border-white/40 bg-[#c9cacd] uppercase tracking-wide text-ink">Auditory • {percentage}%</span>
          {isDominant && <span className="nm-badge bg-obsidian text-white">Primary Match</span>}
        </div>
        {speechSupported && (
          <div className="flex items-center gap-2">
            <div className="nm-inset flex overflow-hidden !rounded-[10px] text-xs font-medium">
              <button type="button" onClick={() => handleSpeedChange(1)} className={`px-2.5 py-1.5 transition ${playbackRate === 1 ? "bg-obsidian text-white" : "text-ink-2 hover:bg-white/30"}`}>1.0x</button>
              <button type="button" onClick={() => handleSpeedChange(1.5)} className={`px-2.5 py-1.5 transition ${playbackRate === 1.5 ? "bg-obsidian text-white" : "text-ink-2 hover:bg-white/30"}`}>1.5x</button>
            </div>
            <button type="button" onClick={handleTogglePlay} className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs ${isSpeaking ? "nm-pill" : "nm-dark"}`}>
              {isSpeaking ? "⏹ Stop Audio" : "▶ Listen to Mini-Podcast"}
            </button>
          </div>
        )}
      </div>
      <h3 className="mb-3 text-[20px] font-medium tracking-[-0.01em] text-ink">{title}</h3>
      <div className="nm-inset mb-4 p-4 text-[13px] leading-relaxed text-ink-2">
        <p className="nm-micro mb-1">Audio Explainer Script</p>
        <p className="whitespace-pre-line">{podcastScript}</p>
      </div>
      {mnemonics && mnemonics.length > 0 && (
        <div>
          <p className="nm-micro mb-2">Verbal Recall Hooks & Mnemonics</p>
          <ul className="space-y-1.5">
            {mnemonics.map((item, idx) => (
              <li key={idx} className="nm-inset flex items-start gap-2 px-3 py-2 text-[13px] text-ink">
                <span className="text-ink-3">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
