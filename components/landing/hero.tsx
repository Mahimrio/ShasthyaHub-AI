import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ResultCardMockup } from "./result-card-mockup";

function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
    </svg>
  );
}

const stats = [
  { emoji: "🧿", label: "Eye Screening" },
  { emoji: "📋", label: "Prescription OCR" },
  { emoji: "🍛", label: "Calorie Analysis" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 md:py-24 lg:grid-cols-2 lg:gap-8">
        {/* Left: copy */}
        <div className="flex flex-col">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
            SciBlitz AI Challenge 2026 — Track A
          </p>

          <h1 className="mt-6 text-balance text-4xl font-black leading-[1.05] tracking-tight text-gray-900 md:text-6xl">
            Healthcare for
            <br />
            <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
              170 Million
            </span>
            <br />
            Bangladeshis.
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-gray-500">
            AI-powered eye screening, prescription safety, and dietary guidance
            — accessible from any smartphone. No doctor needed.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/demo"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-8 font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.99]"
            >
              Try Demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-300 px-8 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <GithubMark className="h-4 w-4" />
              View on GitHub
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {stats.map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-600"
              >
                <span aria-hidden="true">{s.emoji}</span>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Right: floating mockup */}
        <div className="relative hidden lg:block">
          <div className="absolute -inset-x-8 -top-8 bottom-0 -z-10 rounded-[2rem] bg-gradient-to-br from-sky-50 to-emerald-50" />
          <div className="flex justify-center">
            <ResultCardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
