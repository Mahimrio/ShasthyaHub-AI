'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Eye, FileText, Utensils, ChevronRight, Activity } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

interface ReportItem {
  type: 'eye' | 'prescription' | 'food'
  id: string
  summary_en: string
  summary_bn: string
  severity_or_risk: string
  created_at: string
  status: string
}

const typeMeta = {
  eye: {
    icon: Eye,
    tint: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
    en: 'Eye Screening',
    bn: 'চোখের স্ক্রিনিং',
  },
  prescription: {
    icon: FileText,
    tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    en: 'Prescription',
    bn: 'প্রেসক্রিপশন',
  },
  food: {
    icon: Utensils,
    tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    en: 'Food Analysis',
    bn: 'খাদ্য বিশ্লেষণ',
  },
} as const

function severityDot(s: string): { dot: string; labelEn: string; labelBn: string } {
  const v = s?.toLowerCase()
  if (['critical', 'red', 'true'].includes(v)) return { dot: 'bg-red-500', labelEn: 'High risk', labelBn: 'উচ্চ ঝুঁকি' }
  if (['high', 'medium', 'yellow'].includes(v)) return { dot: 'bg-amber-500', labelEn: 'Caution', labelBn: 'সতর্কতা' }
  if (['low', 'green', 'normal'].includes(v)) return { dot: 'bg-emerald-500', labelEn: 'Normal', labelBn: 'স্বাভাবিক' }
  return { dot: 'bg-gray-300 dark:bg-gray-600', labelEn: 'Pending', labelBn: 'প্রক্রিয়াধীন' }
}

function timeAgo(iso: string, lang: 'bn' | 'en'): string {
  const sec = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  const fmt = (n: number) => (lang === 'bn' ? new Intl.NumberFormat('bn-BD').format(n) : String(n))
  if (sec < 60) return lang === 'bn' ? 'এইমাত্র' : 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return lang === 'bn' ? `${fmt(min)} মিনিট আগে` : `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return lang === 'bn' ? `${fmt(hr)} ঘণ্টা আগে` : `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return lang === 'bn' ? `${fmt(day)} দিন আগে` : `${day}d ago`
  return new Date(iso).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric' })
}

export function RecentActivity() {
  const { lang } = useLanguage()

  const { data, isLoading, isError } = useQuery<{ data: ReportItem[] }>({
    queryKey: ['recentActivity'],
    queryFn: async () => {
      const res = await fetch('/api/reports?page=1&limit=3')
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    staleTime: 30_000,
    retry: 1,
  })

  const items = data?.data ?? []

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-sm overflow-hidden">
      <header className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            {lang === 'bn' ? 'সাম্প্রতিক' : 'Recent'}
          </h2>
        </div>
        {items.length > 0 && (
          <Link
            href="/reports"
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
          >
            {lang === 'bn' ? 'সব দেখুন' : 'View all'}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </header>

      {isLoading ? (
        <div className="px-5 pb-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/5 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-2.5 w-3/5 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      ) : isError || items.length === 0 ? (
        <div className="px-5 pb-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lang === 'bn'
              ? 'এখনও কোনো বিশ্লেষণ নেই — উপরের একটি এজেন্ট দিয়ে শুরু করুন।'
              : 'No analyses yet — start with one of the agents above.'}
          </p>
        </div>
      ) : (
        <motion.ul
          className="divide-y divide-gray-100 dark:divide-gray-800"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        >
          {items.map((item) => {
            const meta = typeMeta[item.type]
            const Icon = meta.icon
            const sev = severityDot(item.severity_or_risk)
            return (
              <motion.li
                key={`${item.type}-${item.id}`}
                variants={{
                  hidden: { opacity: 0, x: -12 },
                  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } },
                }}
              >
                <Link
                  href="/reports"
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', meta.tint)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {lang === 'bn' ? meta.bn : meta.en}
                    </span>
                    <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                      {(lang === 'bn' ? item.summary_bn : item.summary_en) || '—'}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="flex items-center justify-end gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                      <span className={cn('h-1.5 w-1.5 rounded-full', sev.dot)} />
                      {lang === 'bn' ? sev.labelBn : sev.labelEn}
                    </span>
                    <span className="mt-0.5 block text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
                      {timeAgo(item.created_at, lang)}
                    </span>
                  </span>
                </Link>
              </motion.li>
            )
          })}
        </motion.ul>
      )}
    </section>
  )
}
