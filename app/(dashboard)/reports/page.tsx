'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Eye, FileText, Utensils, Search, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PDFDownloadButton } from '@/components/shared/PDFDownloadButton'
import Link from 'next/link'

type FilterType = 'all' | 'eye' | 'prescription' | 'food'

interface ReportItem {
  type: 'eye' | 'prescription' | 'food'
  id: string
  summary_en: string
  summary_bn: string
  severity_or_risk: string
  created_at: string
  status: string
}

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

const typeLabels = {
  eye: { en: 'Eye Screening', bn: 'চোখের স্ক্রিনিং' },
  prescription: { en: 'Prescription Analysis', bn: 'প্রেসক্রিপশন বিশ্লেষণ' },
  food: { en: 'Food Analysis', bn: 'খাদ্য বিশ্লেষণ' },
}

function severityBadgeVariant(severityOrRisk: string) {
  const s = severityOrRisk?.toLowerCase()
  if (!s || s === 'pending' || s === 'processing') return 'outline' as const
  if (['critical', 'red', 'true'].includes(s)) return 'critical' as const
  if (['high', 'yellow', 'medium'].includes(s)) return 'high' as const
  if (['low', 'green'].includes(s)) return 'low' as const
  if (['normal'].includes(s)) return 'normal' as const
  return 'default' as const
}

function formatDate(iso: string, lang: 'bn' | 'en') {
  try {
    return new Date(iso).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function ReportsPage() {
  const { lang } = useLanguage()
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [reports, setReports] = useState<ReportItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const mountedRef = useRef(false)

  const fetchReports = useCallback(async (pageNum: number, replace: boolean, filter: FilterType) => {
    setLoading(true)
    setError(null)
    try {
      const typeParam = filter === 'all' ? '' : `&type=${filter}`
      const res = await fetch(`/api/reports?page=${pageNum}&limit=20${typeParam}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      if (json.data) {
        setReports(prev => replace ? json.data : [...prev, ...json.data])
        setHasMore(json.data.length >= 20)
        if (replace) setPage(pageNum)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch on mount
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      fetchReports(1, true, activeFilter)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter)
    setReports([])
    setHasMore(true)
    setError(null)
    fetchReports(1, true, filter)
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchReports(next, false, activeFilter)
  }

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
            onClick={() => handleFilterChange(f.key)}
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

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => fetchReports(1, true, activeFilter)} className="ml-auto text-xs font-medium underline">
            {lang === 'bn' ? 'পুনরায় চেষ্টা' : 'Retry'}
          </button>
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && !error && reports.length === 0 && (
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
              ? 'প্রথমে একটি বিশ্লেষণ সম্পন্ন করুন — নয়ান AI 🧿 দিয়ে শুরু করুন'
              : 'Start by completing an analysis — try NayanAI 🧿'}
          </p>
          <Link
            href="/nayan-ai"
            className="inline-flex items-center gap-1 mt-4 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors"
          >
            {lang === 'bn' ? 'চোখ পরীক্ষা করুন' : 'Start Eye Test'}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </motion.div>
      )}

      {/* Report list */}
      {reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((item, i) => {
            const Icon = typeIcons[item.type]
            const label = typeLabels[item.type]
            const badgeVariant = severityBadgeVariant(item.severity_or_risk)
            const isDangerous = ['critical', 'red', 'true'].includes(item.severity_or_risk?.toLowerCase())

            return (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  'bg-white dark:bg-gray-800 rounded-2xl border p-4 flex items-center gap-4 transition-shadow hover:shadow-sm',
                  isDangerous
                    ? 'border-red-200 dark:border-red-900/50'
                    : 'border-gray-100 dark:border-gray-700'
                )}
              >
                <div className={cn('w-10 h-10 bg-gradient-to-br rounded-xl flex items-center justify-center shrink-0', typeGradients[item.type])}>
                  <Icon className="h-5 w-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {lang === 'bn' ? label.bn : label.en}
                    </p>
                    {item.severity_or_risk && (
                      <Badge variant={badgeVariant}>
                        {item.severity_or_risk === 'true'
                          ? lang === 'bn' ? 'বিপজ্জনক' : 'Dangerous'
                          : item.severity_or_risk.toUpperCase()}
                      </Badge>
                    )}
                    <Badge variant={item.status === 'complete' ? 'green' : item.status === 'failed' ? 'red' : 'yellow'}>
                      {item.status === 'complete'
                        ? lang === 'bn' ? 'সম্পন্ন' : 'Complete'
                        : item.status === 'failed'
                          ? lang === 'bn' ? 'ব্যর্থ' : 'Failed'
                          : lang === 'bn' ? 'প্রক্রিয়াধীন' : 'Processing'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">
                    {lang === 'bn' ? item.summary_bn : item.summary_en}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {formatDate(item.created_at, lang)}
                  </p>
                </div>

                <PDFDownloadButton type={item.type} analysisId={item.id} />
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Load more */}
      {hasMore && reports.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <span>{lang === 'bn' ? 'আরো লোড করুন' : 'Load More'}</span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
