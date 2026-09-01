'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  Eye,
  FileText,
  Utensils,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  WifiOff,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function ReportsPage() {
  const { lang } = useLanguage()
  const { isOnline } = useNetworkStatus()
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [reports, setReports] = useState<ReportItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<ReportItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const mountedRef = useRef(false)
  const langRef = useRef(lang)
  useEffect(() => {
    langRef.current = lang
  }, [lang])

  const fetchReports = useCallback(
    async (pageNum: number, replace: boolean, filter: FilterType) => {
      if (!isOnline) {
        setError(
          langRef.current === 'bn'
            ? 'আপনি অফলাইনে আছেন — লাইভ ডেটা অনুপলব্ধ'
            : 'You are offline — live data unavailable'
        )
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const ac = new AbortController()
        const timeout = setTimeout(() => ac.abort(), 8000)
        const typeParam = filter === 'all' ? '' : `&type=${filter}`
        const res = await fetch(`/api/reports?page=${pageNum}&limit=20${typeParam}`, {
          signal: ac.signal,
        })
        clearTimeout(timeout)
        if (!res.ok) {
          throw new Error(
            langRef.current === 'bn'
              ? 'রিপোর্ট লোড করা যায়নি — কিছুক্ষণ পর আবার চেষ্টা করুন'
              : 'Could not load reports — please try again in a moment'
          )
        }
        const json = await res.json()
        if (json.data) {
          setReports((prev) => (replace ? json.data : [...prev, ...json.data]))
          setHasMore(json.data.length >= 20)
          if (replace) setPage(pageNum)
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setError(
            langRef.current === 'bn'
              ? 'অনুরোধ সময় শেষ — অনুগ্রহ করে পুনরায় চেষ্টা করুন'
              : 'Request timed out — please try again'
          )
        } else if (err instanceof TypeError) {
          setError(
            langRef.current === 'bn'
              ? 'সার্ভারে সংযোগ করা যাচ্ছে না — ইন্টারনেট সংযোগ পরীক্ষা করুন'
              : 'Could not reach the server — check your internet connection'
          )
        } else {
          setError(err instanceof Error ? err.message : 'An error occurred')
        }
      } finally {
        setLoading(false)
      }
    },
    [isOnline]
  )

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

  // Handle report deletion
  const handleDeleteReport = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch(
        `/api/reports?id=${deleteTarget.id}&type=${deleteTarget.type}`,
        { method: 'DELETE' }
      )
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete report')
      }

      // Remove deleted report from state
      setReports((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not delete report'
      setDeleteError(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      {/* Dynamic Animated Fixed Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/20 dark:from-gray-950 dark:via-purple-950/30 dark:to-pink-950/20 animate-gradient-bg z-0 motion-reduce:animate-none motion-reduce:bg-gray-50 motion-reduce:dark:bg-gray-950">
        {/* Ambient Radial Gradient Blobs */}
        <div className="absolute -left-32 top-10 h-[700px] w-[700px] rounded-full bg-purple-300/40 dark:bg-purple-500/20 blur-[140px] motion-reduce:hidden animate-float-1" />
        <div className="absolute -right-32 top-40 h-[700px] w-[700px] rounded-full bg-pink-300/35 dark:bg-pink-500/20 blur-[140px] motion-reduce:hidden animate-float-2" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[500px] w-[800px] rounded-full bg-fuchsia-200/25 dark:bg-fuchsia-600/15 blur-[160px] motion-reduce:hidden animate-float-3" />
      </div>

      <div className="relative min-h-screen z-10">
        <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
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
              <button
                onClick={() => fetchReports(1, true, activeFilter)}
                className="ml-auto text-xs font-medium underline"
              >
                {lang === 'bn' ? 'পুনরায় চেষ্টা' : 'Retry'}
              </button>
            </motion.div>
          )}

          {/* Offline state */}
          {!isOnline && reports.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 dark:backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/60 p-10 text-center shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
            >
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <WifiOff className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {lang === 'bn' ? 'আপনি অফলাইনে আছেন' : 'You are offline'}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {lang === 'bn'
                  ? 'লাইভ ডেটা উপলভ্য নয়। অনলাইনে সংযুক্ত হলে পুনরায় চেষ্টা করুন।'
                  : 'Live data is unavailable. Please reconnect to refresh.'}
              </p>
            </motion.div>
          )}

          {/* Empty state */}
          {!loading && !error && reports.length === 0 && isOnline && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 dark:backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/60 p-10 text-center shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
            >
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {lang === 'bn' ? 'কোনো রিপোর্ট নেই' : 'No reports found'}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {lang === 'bn'
                  ? 'প্রথমে একটি বিশ্লেষণ সম্পন্ন করুন — নয়ান AI দিয়ে শুরু করুন'
                  : 'Start by completing an analysis — try NayanAI'}
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
              <AnimatePresence mode="popLayout">
                {reports.map((item, i) => {
                  const Icon = typeIcons[item.type]
                  const label = typeLabels[item.type]
                  const badgeVariant = severityBadgeVariant(item.severity_or_risk)
                  const isDangerous = ['critical', 'red', 'true'].includes(
                    item.severity_or_risk?.toLowerCase()
                  )

                  return (
                    <motion.div
                      key={`${item.type}-${item.id}`}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      transition={{ delay: i * 0.04 }}
                      className={cn(
                        'bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 dark:backdrop-blur-sm rounded-2xl border p-4 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 shadow-[0_10px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(168,85,247,0.06)] hover:shadow-[0_20px_60px_rgba(168,85,247,0.12),0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4),0_4px_12px_rgba(168,85,247,0.08)] dark:hover:shadow-[0_20px_60px_rgba(168,85,247,0.15),0_8px_24px_rgba(0,0,0,0.5)]',
                        isDangerous
                          ? 'border-red-200 dark:border-red-900/50'
                          : 'border-gray-100 dark:border-gray-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 bg-gradient-to-br rounded-xl flex items-center justify-center shrink-0',
                          typeGradients[item.type]
                        )}
                      >
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
                                ? lang === 'bn'
                                  ? 'বিপজ্জনক'
                                  : 'Dangerous'
                                : item.severity_or_risk.toUpperCase()}
                            </Badge>
                          )}
                          <Badge
                            variant={
                              item.status === 'complete'
                                ? 'green'
                                : item.status === 'failed'
                                  ? 'red'
                                  : 'yellow'
                            }
                          >
                            {item.status === 'complete'
                              ? lang === 'bn'
                                ? 'সম্পন্ন'
                                : 'Complete'
                              : item.status === 'failed'
                                ? lang === 'bn'
                                  ? 'ব্যর্থ'
                                  : 'Failed'
                                : lang === 'bn'
                                  ? 'প্রক্রিয়াধীন'
                                  : 'Processing'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">
                          {lang === 'bn' ? item.summary_bn : item.summary_en}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                          {formatDate(item.created_at, lang)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <PDFDownloadButton type={item.type} analysisId={item.id} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(item)}
                          className="h-8 w-8 p-0 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title={lang === 'bn' ? 'রিপোর্ট মুছে ফেলুন' : 'Delete Report'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
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
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-1">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-gray-900 dark:text-gray-100">
              {lang === 'bn' ? 'রিপোর্টটি মুছে ফেলতে চান?' : 'Delete this report?'}
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              {lang === 'bn'
                ? 'এই রিপোর্টটি স্থায়ীভাবে মুছে ফেলা হবে এবং এটি আর ফিরিয়ে আনা যাবে না।'
                : 'This report will be permanently removed from your analysis history.'}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
              className="h-9 px-4 rounded-xl text-xs font-semibold"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteReport}
              className="h-9 px-4 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  <span>{lang === 'bn' ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...'}</span>
                </>
              ) : (
                <span>{lang === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}</span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
