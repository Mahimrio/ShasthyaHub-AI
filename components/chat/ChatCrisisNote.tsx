'use client'

import { Phone, Ambulance, Heart } from 'lucide-react'
import type { RedFlagLevel } from '@/hooks/useChat'

/** Crisis card shown when the user's message contains red-flag keywords. */
export function ChatCrisisNote({ level, lang }: { level: RedFlagLevel; lang: 'bn' | 'en' }) {
  if (level === 'none') return null

  const selfHarm = level === 'self-harm'
  return (
    <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-3 dark:border-rose-900/50 dark:bg-rose-950/30">
      <p className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">
        <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
        {selfHarm
          ? lang === 'bn' ? 'আপনি একা নন — সাহায্য আছে' : 'You are not alone — help is available'
          : lang === 'bn' ? 'জরুরি হলে এখনই কল করুন' : 'If this is an emergency, call now'}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {selfHarm && (
          <a href="tel:16463" className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5">
            <Phone className="h-3 w-3" /> 16463 · {lang === 'bn' ? 'শুচনা হেল্পলাইন' : 'Shuchona helpline'}
          </a>
        )}
        <a href="tel:999" className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5">
          <Ambulance className="h-3 w-3" /> 999
        </a>
        <a href="tel:16263" className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-rose-700 shadow-sm transition-transform hover:-translate-y-0.5 dark:border-rose-800 dark:bg-gray-900 dark:text-rose-300">
          <Phone className="h-3 w-3" /> 16263 · {lang === 'bn' ? 'স্বাস্থ্য বাতায়ন' : 'Health line'}
        </a>
      </div>
    </div>
  )
}
