"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, Play, Pause, Square } from "lucide-react";
import { bengaliScheduleScript } from "./data";

type Status = "idle" | "playing" | "paused";

export function AudioGuide() {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const supportedRef = useRef(false);

  useEffect(() => {
    supportedRef.current =
      typeof window !== "undefined" && "speechSynthesis" in window;
    return () => {
      if (supportedRef.current) window.speechSynthesis.cancel();
    };
  }, []);

  // Simulated progress while playing (TTS has no native progress event for duration).
  useEffect(() => {
    if (status !== "playing") return;
    const id = window.setInterval(() => {
      setProgress((p) => (p >= 100 ? 100 : p + 1.2));
    }, 120);
    return () => window.clearInterval(id);
  }, [status]);

  const handlePlay = () => {
    if (!supportedRef.current) {
      setStatus("playing");
      return;
    }
    const synth = window.speechSynthesis;
    if (status === "paused") {
      synth.resume();
      setStatus("playing");
      return;
    }
    synth.cancel();
    setProgress(0);
    const utterance = new SpeechSynthesisUtterance(bengaliScheduleScript);
    utterance.lang = "bn-BD";
    utterance.rate = 0.9;
    utterance.onend = () => {
      setStatus("idle");
      setProgress(100);
    };
    utteranceRef.current = utterance;
    synth.speak(utterance);
    setStatus("playing");
  };

  const handlePause = () => {
    if (supportedRef.current) window.speechSynthesis.pause();
    setStatus("paused");
  };

  const handleStop = () => {
    if (supportedRef.current) window.speechSynthesis.cancel();
    setStatus("idle");
    setProgress(0);
  };

  return (
    <section className="rounded-xl bg-gradient-to-r from-sky-50 to-emerald-50 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-sky-600 shadow-sm">
          <Volume2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-gray-900 sm:text-lg">
            Listen to Schedule in Bengali
          </h2>
          <p className="font-bengali text-sm text-gray-600">
            বাংলায় সূচি শুনুন
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePlay}
              disabled={status === "playing"}
              className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Play
            </button>
            <button
              type="button"
              onClick={handlePause}
              disabled={status !== "playing"}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Pause className="h-4 w-4" aria-hidden="true" />
              Pause
            </button>
            <button
              type="button"
              onClick={handleStop}
              disabled={status === "idle"}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Square className="h-4 w-4" aria-hidden="true" />
              Stop
            </button>
          </div>

          <div
            className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/70"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
