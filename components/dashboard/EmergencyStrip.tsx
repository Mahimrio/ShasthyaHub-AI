'use client'

import { Phone, Ambulance } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

/** Bangladesh health helplines — tap-to-call. */
export function EmergencyStrip() {
  const { lang } = useLanguage()

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-rose-200/60 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">
        {lang === 'bn' ? 'জরুরি প্রয়োজনে —' : 'In an emergency —'}
        <span className="ml-1 font-normal text-rose-700/80 dark:text-rose-300/70">
          {lang === 'bn' ? 'সরাসরি কল করুন' : 'call directly'}
        </span>
      </p>
      <div className="flex gap-2.5">
        <a
          href="tel:16263"
          className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-gray-900 border border-rose-200 dark:border-rose-900/60 px-4 py-2 text-sm font-bold text-rose-700 dark:text-rose-300 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          <Phone className="h-4 w-4" />
          <span className="tabular-nums">16263</span>
          <span className="hidden text-xs font-medium text-rose-500/80 dark:text-rose-400/70 sm:inline">
            {lang === 'bn' ? 'স্বাস্থ্য বাতায়ন' : 'Health Line'}
          </span>
        </a>
        <a
          href="tel:999"
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-rose-600/25 hover:bg-rose-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          <Ambulance className="h-4 w-4" />
          <span className="tabular-nums">999</span>
          <span className="hidden text-xs font-medium text-rose-100/90 sm:inline">
            {lang === 'bn' ? 'জাতীয় জরুরি সেবা' : 'Emergency'}
          </span>
        </a>
      </div>
    </section>
  )
}
