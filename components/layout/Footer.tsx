'use client'

import { HeartPulse, Phone, Ambulance, ShieldAlert } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export function Footer({ variant = 'full' }: { variant?: 'full' | 'minimal' }) {
  const { lang } = useLanguage()
  const year = new Date().getFullYear()

  if (variant === 'minimal') {
    return (
      <footer className="relative z-10 pb-5 pt-6 text-center">
        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-600">
          © {year} ShasthyaHub-AI ·{' '}
          {lang === 'bn'
            ? 'এআই স্ক্রিনিং টুল — চিকিৎসকের বিকল্প নয়'
            : 'AI screening tool — not a substitute for a doctor'}
        </p>
      </footer>
    )
  }

  return (
    <footer className="relative z-10 mt-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-colors">
      <div className="h-px bg-gradient-to-r from-sky-500/50 via-cyan-500/50 to-emerald-500/50" />

      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2.5 px-4 py-4 sm:flex-row md:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500">
            <HeartPulse className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">ShasthyaHub-AI</span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">© {year}</span>
        </div>

        {/* Disclaimer */}
        <p className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          {lang === 'bn'
            ? 'এআই স্ক্রিনিং — চিকিৎসকের বিকল্প নয়'
            : 'AI screening — not a substitute for a doctor'}
        </p>

        {/* Helplines */}
        <div className="flex items-center gap-2">
          <a
            href="tel:16263"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-[11px] font-bold tabular-nums text-gray-600 transition-colors hover:border-rose-300 hover:text-rose-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-rose-800 dark:hover:text-rose-400"
          >
            <Phone className="h-3 w-3 text-rose-500" />
            16263
          </a>
          <a
            href="tel:999"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-[11px] font-bold tabular-nums text-gray-600 transition-colors hover:border-rose-300 hover:text-rose-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-rose-800 dark:hover:text-rose-400"
          >
            <Ambulance className="h-3 w-3 text-rose-500" />
            999
          </a>
        </div>
      </div>
    </footer>
  )
}
