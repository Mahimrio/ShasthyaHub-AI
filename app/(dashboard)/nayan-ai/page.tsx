"use client";

import { useRef, useState } from "react";
import {
  Camera,
  Upload,
  CheckCircle2,
  Calendar,
  Download,
  Share2,
  Stethoscope,
  Loader2,
} from "lucide-react";

export default function NayanAIPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setShowResult(false);
  }

  function handleAnalyze() {
    setIsAnalyzing(true);
    setShowResult(false);
    // Simulated analysis — replace with /api/nayan/analyze call
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResult(true);
    }, 1800);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 pb-16 pt-8">
      {/* 1. Header */}
      <header className="flex flex-col gap-1.5">
        <p className="text-xs font-medium tracking-wide text-gray-400">
          NayanAI / <span className="font-bengali">চোখের পরীক্ষা</span>
        </p>
        <h1 className="text-balance text-3xl font-black leading-tight text-gray-900">
          AI Eye Screening
          <br />
          <span className="font-bengali">চোখের রোগ শনাক্তকরণ</span>
        </h1>
      </header>

      {/* 2. Instructions strip */}
      <section
        aria-label="Instructions"
        className="grid grid-cols-3 gap-2 rounded-xl bg-gray-50 px-3 py-4"
      >
        {[
          { n: "①", en: "Hold phone 15cm from eye" },
          { n: "②", en: "Good lighting" },
          { n: "③", en: "Look straight ahead" },
        ].map((step) => (
          <div key={step.n} className="flex flex-col items-center gap-2 text-center">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-semibold text-gray-500 ring-1 ring-gray-100">
              {step.n}
            </span>
            <span className="text-[11px] leading-snug text-gray-500">{step.en}</span>
          </div>
        ))}
      </section>

      {/* 3. Upload zone */}
      <section aria-label="Upload eye photo">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {imageUrl ? (
          <div className="overflow-hidden rounded-2xl border-2 border-emerald-400">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt="Uploaded eye photo preview"
              className="aspect-square w-full object-cover"
            />
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full bg-emerald-50 py-2.5 text-sm font-medium text-emerald-700"
            >
              Change photo / <span className="font-bengali">ছবি পরিবর্তন</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
              isDragging
                ? "border-sky-400 bg-sky-50"
                : "border-gray-200 bg-white hover:border-sky-400 hover:bg-sky-50"
            }`}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Camera className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-gray-900">
              Upload Eye Photo
              <br />
              <span className="font-bengali">চোখের ছবি আপলোড করুন</span>
            </span>
            <span className="flex items-center gap-1.5 text-sm text-gray-400">
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              or take photo with camera
            </span>
          </button>
        )}
      </section>

      {/* 4. Analyze button */}
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={!imageUrl || isAnalyzing}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 font-semibold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:bg-none disabled:text-gray-400"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Analyzing…
          </>
        ) : (
          <>
            Analyze / <span className="font-bengali">বিশ্লেষণ করুন</span>
          </>
        )}
      </button>

      {/* 5. Result card */}
      {showResult && (
        <section
          aria-label="Screening result"
          className="rounded-r-xl border-l-4 border-orange-500 bg-orange-50 p-5"
        >
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-orange-600">
            High Severity — <span className="font-bengali">উচ্চ ঝুঁকি</span>
          </span>

          <h2 className="mt-2 text-2xl font-black leading-tight text-gray-900">
            Suspected Cataract
            <br />
            <span className="font-bengali">সম্ভাব্য ছানি</span>
          </h2>

          {/* Confidence bar */}
          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-orange-200">
              <div className="h-full rounded-full bg-orange-400" style={{ width: "87%" }} />
            </div>
            <p className="mt-1.5 text-xs font-medium text-orange-700">87% confidence</p>
          </div>

          {/* Recommendation box */}
          <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-orange-100/70 p-3">
            <Stethoscope
              className="mt-0.5 h-4 w-4 shrink-0 text-orange-600"
              aria-hidden="true"
            />
            <p className="font-bengali text-sm leading-relaxed text-orange-800">
              একজন চক্ষু বিশেষজ্ঞের সাথে দ্রুত পরামর্শ করুন। অস্ত্রোপচারের মাধ্যমে ছানি
              সম্পূর্ণ নিরাময়যোগ্য।
            </p>
          </div>

          {/* Urgency chip */}
          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              See doctor within 14 days
            </span>
          </div>

          {/* Actions */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              <Download className="h-4 w-4" aria-hidden="true" />
              Download Report
            </button>
            <button className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Share
            </button>
          </div>
        </section>
      )}

      {/* 6. Disclaimer */}
      <footer className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-gray-400">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        AI screening tool only — not a clinical diagnosis
      </footer>
    </main>
  );
}
