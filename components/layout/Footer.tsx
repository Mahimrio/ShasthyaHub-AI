'use client'

import Link from 'next/link'
import {
  HeartPulse,
  Heart,
  Phone,
  Ambulance,
  Eye,
  FileText,
  Utensils,
  Activity,
  BarChart3,
  ShieldAlert,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const agentLinks = [
  { href: '/nayan-ai', icon: Eye, en: 'Nayan AI', bn: 'নয়ান AI' },
  { href: '/scriptguard', icon: FileText, en: 'ScriptGuard', bn: 'স্ক্রিপ্টগার্ড' },
  { href: '/glycovision', icon: Utensils, en: 'GlycoVision', bn: 'গ্লাইকোভিশন' },
  { href: '/lokhon', icon: Activity, en: 'Lokhon', bn: 'লক্ষণ' },
  { href: '/reports', icon: BarChart3, en: 'Reports', bn: 'রিপোর্ট' },
]

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
    <footer className="relative z-10 mt-12 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/95 transition-colors">
      <div className="h-0.5 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 opacity-70" />

      <div className="mx-auto max-w-6xl grid gap-8 px-4 py-10 md:grid-cols-3 md:px-6">
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 shadow-md shadow-sky-500/10">
              <HeartPulse className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 bg-clip-text font-black tracking-tight text-transparent dark:from-sky-400 dark:via-cyan-400 dark:to-emerald-400">
              ShasthyaHub-AI
            </span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {lang === 'bn'
              ? 'গ্রামীণ বাংলাদেশের জন্য ৪টি AI স্বাস্থ্য এজেন্ট — চোখ, প্রেসক্রিপশন, খাদ্য ও লক্ষণ বিশ্লেষণ।'
              : 'Four AI health agents for rural Bangladesh — eye, prescription, food & symptom analysis.'}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            {lang === 'bn' ? 'ভালোবাসায় তৈরি' : 'Made with'}
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
            {lang === 'bn' ? 'গ্রামীণ বাংলাদেশের জন্য' : 'for rural Bangladesh'}
          </p>
        </div>

        {/* Agent links */}
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">
            {lang === 'bn' ? 'এআই এজেন্ট' : 'AI Agents'}
          </p>
          <ul className="space-y-2.5">
            {agentLinks.map((l) => {
              const Icon = l.icon
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="group inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400"
                  >
                    <Icon className="h-4 w-4 text-gray-400 transition-colors group-hover:text-sky-500 dark:text-gray-500" />
                    {lang === 'bn' ? l.bn : l.en}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Emergency helplines */}
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">
            {lang === 'bn' ? 'জরুরি হেল্পলাইন' : 'Emergency Helplines'}
          </p>
          <div className="space-y-2.5">
            <a
              href="tel:16263"
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-2.5 transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-sm dark:border-gray-800 dark:bg-gray-950/40 dark:hover:border-rose-900/50"
            >
              <Phone className="h-4 w-4 shrink-0 text-rose-500" />
              <span className="text-sm font-bold tabular-nums text-gray-800 dark:text-gray-200">16263</span>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                {lang === 'bn' ? 'স্বাস্থ্য বাতায়ন' : 'Shastho Batayon'}
              </span>
            </a>
            <a
              href="tel:999"
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-2.5 transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-sm dark:border-gray-800 dark:bg-gray-950/40 dark:hover:border-rose-900/50"
            >
              <Ambulance className="h-4 w-4 shrink-0 text-rose-500" />
              <span className="text-sm font-bold tabular-nums text-gray-800 dark:text-gray-200">999</span>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                {lang === 'bn' ? 'জাতীয় জরুরি সেবা' : 'National Emergency'}
              </span>
            </a>
          </div>
          <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">
            {lang === 'bn' ? 'সরকারি হেল্পলাইন — টোল-ফ্রি' : 'Government helplines — toll-free'}
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-100 dark:border-gray-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 sm:flex-row md:px-6">
          <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
            © {year} ShasthyaHub-AI · SciBlitz AI Challenge
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            {lang === 'bn'
              ? 'এআই স্ক্রিনিং টুল — চিকিৎসকের বিকল্প নয়'
              : 'AI screening tool — not a substitute for a doctor'}
          </p>
        </div>
      </div>
    </footer>
  )
}
