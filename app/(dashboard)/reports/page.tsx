'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Eye, FileText, Utensils, ChevronRight, Search } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type FilterType = 'all' | 'eye' | 'prescription' | 'food'

interface AnalysisItem {
  id: string
  type: 'eye' | 'prescription' | 'food'
  titleEn: string
  titleBn: string
  date: string
  status: 'complete' | 'failed' | 'processing'
  severity?: string
}

const mockData: AnalysisItem[] = [
  { id: '1', type: 'eye', titleEn: 'Eye Screening', titleBn: 'চোখের স্ক্রিনিং', date: '2026-06-23', status: 'complete', severity: 'High' },
  { id: '2', type: 'prescription', titleEn: 'Prescription Analysis', titleBn: 'প্রেসক্রিপশন বিশ্লেষণ', date: '2026-06-22', status: 'complete' },
  { id: '3', type: 'food', titleEn: 'Meal Analysis', titleBn: 'খাদ্য বিশ্লেষণ', date: '2026-06-21', status: 'complete', severity: 'Green' },
  { id: '4', type: 'eye', titleEn: 'Eye Screening', titleBn: 'চোখের স্ক্রিনিং', date: '2026-06-15', status: 'failed' },
]

const filters: { key: FilterType; labelEn: string; labelBn: string }[] = [
  { key: 'all', labelEn: 'All', labelBn: 'সব' },
  { key: 'eye', labelEn: 'Eye', labelBn: 'চোখ' },
  { key: 'prescription', labelEn: 'Prescription', labelBn: 'প্রেসক্রিপশন' },
  { key: 'food', labelEn: 'Food', labelBn: 'খাদ্য' },
]

const typeIcons = {
  eye: Eye,
  prescription: FileText,
  food: Utensils,
}

const typeGradients = {
  eye: 'from-sky-500 to-cyan-500',
  prescription: 'from-emerald-500 to-teal-500',
  food: 'from-amber-500 to-orange-500',
}

const statusBadge = (status: AnalysisItem['status']) => {
  switch (status) {
    case 'complete': return { label: 'Complete', variant: 'green' as const }
    case 'failed': return { label: 'Failed', variant: 'red' as const }
    case 'processing': return { label: 'Processing', variant: 'yellow' as const }
  }
}

const severityBadge = (severity?: string) => {
  if (!severity) return null
  switch (severity) {
    case 'Critical': return { label: 'Critical', variant: 'critical' as const }
    case 'High': return { label: 'High', variant: 'high' as const }
    case 'Medium': return { label: 'Medium', variant: 'medium' as const }
    case 'Low': return { label: 'Low', variant: 'low' as const }
    case 'Green': return { label: 'Normal', variant: 'normal' as const }
    default: return null
  }
}

export default function ReportsPage() {
  const { lang } = useLanguage()
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const filtered = activeFilter === 'all'
    ? mockData
    : mockData.filter((item) => item.type === activeFilter)

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
            {lang === 'bn' ? 'রিপোর্ট ও ইতিহাস' : 'Reports & History'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === 'bn'
              ? 'আপনার সব বিশ্লেষণের ইতিহাস এক জায়গায়'
              : 'Your complete analysis history'}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
              activeFilter === f.key
                ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {lang === 'bn' ? f.labelBn : f.labelEn}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center"
        >
          <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            {lang === 'bn' ? 'কোনো রিপোর্ট নেই' : 'No reports found'}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {lang === 'bn'
              ? 'প্রথমে একটি বিশ্লেষণ সম্পন্ন করুন'
              : 'Start by completing an analysis'}
          </p>
        </motion.div>
      )}

      {/* Analysis list */}
      <div className="space-y-3">
        {filtered.map((item, i) => {
          const Icon = typeIcons[item.type]
          const badge = statusBadge(item.status)
          const sevBadge = severityBadge(item.severity)
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/reports/${item.id}`}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4 hover:shadow-sm dark:hover:shadow-none transition-shadow block"
              >
                <div className={cn('w-10 h-10 bg-gradient-to-br rounded-xl flex items-center justify-center shrink-0', typeGradients[item.type])}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {lang === 'bn' ? item.titleBn : item.titleEn}
                    </p>
                    {sevBadge && (
                      <Badge variant={sevBadge.variant}>{sevBadge.label}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.date}</p>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
                <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
