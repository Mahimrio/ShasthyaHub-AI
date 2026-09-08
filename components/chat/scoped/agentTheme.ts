import type { ChatAgent } from '@/types'

/** Static class strings only — Tailwind cannot see dynamically built names. */
export interface AgentTheme {
  nameEn: string
  nameBn: string
  /** Solid dot / avatar */
  dot: string
  /** Send button + active chip fill */
  gradient: string
  /** Active chip (outline style) */
  chipActive: string
  /** Focus ring on the composer card */
  ring: string
  /** Streaming caret + link accents */
  text: string
  placeholderIdleEn: string
  placeholderIdleBn: string
  placeholderResultEn: string
  placeholderResultBn: string
}

export const AGENT_THEME: Record<ChatAgent, AgentTheme> = {
  scriptguard: {
    nameEn: 'ScriptGuard',
    nameBn: 'স্ক্রিপ্টগার্ড',
    dot: 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500',
    gradient: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500',
    chipActive: 'border-emerald-400/70 bg-emerald-50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-300',
    ring: 'focus-within:ring-emerald-500/25 focus-within:border-emerald-400/60 dark:focus-within:border-emerald-500/50',
    text: 'text-emerald-600 dark:text-emerald-400',
    placeholderIdleEn: 'Ask how ScriptGuard reads a prescription…',
    placeholderIdleBn: 'স্ক্রিপ্টগার্ড কীভাবে কাজ করে জিজ্ঞাসা করুন…',
    placeholderResultEn: 'Ask about this prescription…',
    placeholderResultBn: 'এই প্রেসক্রিপশন নিয়ে জিজ্ঞাসা করুন…',
  },
  glycovision: {
    nameEn: 'GlycoVision',
    nameBn: 'গ্লাইকোভিশন',
    dot: 'bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500',
    gradient: 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500',
    chipActive: 'border-amber-400/70 bg-amber-50 text-amber-700 dark:border-amber-500/50 dark:bg-amber-500/15 dark:text-amber-300',
    ring: 'focus-within:ring-amber-500/25 focus-within:border-amber-400/60 dark:focus-within:border-amber-500/50',
    text: 'text-amber-600 dark:text-amber-400',
    placeholderIdleEn: 'Ask how GlycoVision analyses a meal…',
    placeholderIdleBn: 'গ্লাইকোভিশন কীভাবে খাবার বিশ্লেষণ করে জিজ্ঞাসা করুন…',
    placeholderResultEn: 'Ask about this meal…',
    placeholderResultBn: 'এই খাবার নিয়ে জিজ্ঞাসা করুন…',
  },
  lokhon: {
    nameEn: 'Lokhon',
    nameBn: 'লক্ষণ',
    dot: 'bg-gradient-to-br from-rose-500 to-amber-500',
    gradient: 'bg-gradient-to-r from-rose-500 to-amber-500',
    chipActive: 'border-rose-400/70 bg-rose-50 text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-300',
    ring: 'focus-within:ring-rose-500/25 focus-within:border-rose-400/60 dark:focus-within:border-rose-500/50',
    text: 'text-rose-600 dark:text-rose-400',
    placeholderIdleEn: 'Ask about this screening or a question…',
    placeholderIdleBn: 'এই পরীক্ষা বা কোনো প্রশ্ন নিয়ে জিজ্ঞাসা করুন…',
    placeholderResultEn: 'Ask about this result…',
    placeholderResultBn: 'এই ফলাফল নিয়ে জিজ্ঞাসা করুন…',
  },
}
