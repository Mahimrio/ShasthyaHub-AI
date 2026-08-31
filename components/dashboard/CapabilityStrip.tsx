'use client'

import { WifiOff, Languages, Cpu, ShieldCheck } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const items = [
  {
    icon: WifiOff,
    en: 'Works offline',
    bn: 'অফলাইনেও চলে',
    subEn: 'On-device AI when no network',
    subBn: 'নেটওয়ার্ক ছাড়াই অন-ডিভাইস AI',
    color: 'text-sky-500',
    bg: 'bg-sky-500/10 dark:bg-sky-500/15',
  },
  {
    icon: Languages,
    en: 'বাংলা + English',
    bn: 'বাংলা + English',
    subEn: 'Fully bilingual interface',
    subBn: 'সম্পূর্ণ দ্বিভাষিক ইন্টারফেস',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
  },
  {
    icon: Cpu,
    en: 'Dual AI engines',
    bn: 'ডুয়াল AI ইঞ্জিন',
    subEn: 'Gemini vision + Groq reasoning',
    subBn: 'Gemini ভিশন + Groq রিজনিং',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
  },
  {
    icon: ShieldCheck,
    en: 'Private by design',
    bn: 'গোপনীয়তা সুরক্ষিত',
    subEn: 'Your data stays yours',
    subBn: 'আপনার তথ্য আপনারই থাকে',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
  },
]

/** Trust markers strip — why this app works for rural Bangladesh. */
export function CapabilityStrip() {
  const { lang } = useLanguage()

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.en}
            className="flex items-start gap-3 rounded-2xl border border-gray-200/50 bg-white/80 p-3.5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700/60 dark:bg-gray-900/80"
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
              <Icon className={`h-4.5 w-4.5 ${item.color}`} strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {lang === 'bn' ? item.bn : item.en}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-gray-400 dark:text-gray-500">
                {lang === 'bn' ? item.subBn : item.subEn}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
