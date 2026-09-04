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
    <footer className="relative z-10 mt-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-colors border-t border-gray-100/80 dark:border-gray-800/80">
      <div className="h-0.5 bg-gradient-to-r from-sky-500/40 via-cyan-500/40 to-emerald-500/40" />

      <div className="mx-auto flex max-w-[1460px] 2xl:max-w-[1560px] flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 shadow-sm">
            <HeartPulse className="h-4 w-4 text-white" strokeWidth={2.2} />
          </div>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">ShasthyaHub-AI</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">© {year}</span>
        </div>

        {/* Disclaimer */}
        <p className="flex items-center gap-2 text-xs sm:text-[13px] font-normal text-gray-600 dark:text-gray-400">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
          <span>
            {lang === 'bn'
              ? 'এআই স্ক্রিনিং প্রযুক্তি — নিবন্ধিত চিকিৎসকের বিকল্প নয়'
              : 'AI screening technology — not a substitute for a licensed doctor'}
          </span>
        </p>

        {/* Helplines */}
        <div className="flex items-center gap-2.5">
          <a
            href="tel:16263"
            title={lang === 'bn' ? 'সরকারি স্বাস্থ্য বাতায়ন' : 'National Health Helpline'}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/60 px-3.5 py-1.5 text-xs font-medium tabular-nums text-gray-700 transition-all hover:border-rose-300 hover:text-rose-600 dark:border-gray-700/80 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:border-rose-800 dark:hover:text-rose-400 shadow-2xs cursor-pointer"
          >
            <Phone className="h-3.5 w-3.5 text-rose-500" />
            <span>16263</span>
          </a>
          <a
            href="tel:999"
            title={lang === 'bn' ? 'জাতীয় জরুরি সেবা' : 'Emergency Services'}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/60 px-3.5 py-1.5 text-xs font-medium tabular-nums text-gray-700 transition-all hover:border-rose-300 hover:text-rose-600 dark:border-gray-700/80 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:border-rose-800 dark:hover:text-rose-400 shadow-2xs cursor-pointer"
          >
            <Ambulance className="h-3.5 w-3.5 text-rose-500" />
            <span>999</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
