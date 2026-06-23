'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarClock,
  CheckCircle2,
  Download,
  Info,
  Share2,
  Stethoscope,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { Language, NayanResult } from '@/types'
import { severityLabel, severityStyles } from './severity-styles'

interface EyeResultCardProps {
  result: NayanResult
  lang: Language
}

// Staggered entrance — parent orchestrates children reveal.
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

/** Clamp confidence to a 0–100 integer for the progress meter. */
function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(Math.round(value), 0), 100)
}

export function EyeResultCard({ result, lang }: EyeResultCardProps) {
  const style = severityStyles[result.severity]
  const confidence = clampPercent(result.confidence_score)
  const recommendation = lang === 'bn' ? result.recommendation_bn : result.recommendation_en

  const [isDownloading, setIsDownloading] = useState(false)
  const [shareStatus, setShareStatus] = useState<string | null>(null)

  const handleDownload = useCallback(async () => {
    setIsDownloading(true)
    try {
      // Lazy import keeps jspdf out of the main bundle.
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      let y = 20
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('NayanAI — Eye Screening Report', 14, y)
      y += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120)
      doc.text(`Report ID: ${result.id}`, 14, y)
      y += 6
      doc.text(`Date: ${new Date().toLocaleString()}`, 14, y)
      y += 12

      doc.setDrawColor(220)
      doc.line(14, y, 196, y)
      y += 12

      const addField = (label: string, value: string) => {
        doc.setTextColor(80)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.text(label, 14, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(40)
        const lines = doc.splitTextToSize(value, 182)
        doc.text(lines, 14, y)
        y += lines.length * 5 + 6
      }

      addField('Diagnosis', result.diagnosis)
      addField('Severity', result.severity)
      addField('Confidence', `${confidence}%`)
      addField('Recommendation', recommendation)
      addField(
        'Urgency',
        lang === 'bn'
          ? `${result.urgency_days} দিনের মধ্যে ডাক্তার দেখান`
          : `See a doctor within ${result.urgency_days} days`
      )
      addField('Specialist needed', result.specialist_needed)
      if (result.next_steps.length > 0) {
        addField('Next steps', result.next_steps.map((s, i) => `${i + 1}. ${s}`).join('\n'))
      }

      doc.save(`nayanai-report-${result.id.slice(0, 8)}.pdf`)
    } catch (err) {
      console.error('[EyeResultCard] PDF download failed', err)
    } finally {
      setIsDownloading(false)
    }
  }, [result, confidence, recommendation, lang])

  const handleShare = useCallback(async () => {
    const shareText =
      lang === 'bn'
        ? `NayanAI ফলাফল: ${result.diagnosis} (গুরুত্ব: ${severityLabel(
            result.severity,
            'bn'
          )}, ${confidence}% নিশ্চিত)`
        : `NayanAI result: ${result.diagnosis} (${result.severity}, ${confidence}% confidence)`

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'NayanAI Report', text: shareText })
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText)
        setShareStatus(lang === 'bn' ? 'কপি হয়েছে' : 'Copied')
        setTimeout(() => setShareStatus(null), 2000)
      }
    } catch {
      // User cancelled or share failed — no-op.
    }
  }, [result, confidence, lang])

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* (a) Severity banner */}
      <motion.div
        variants={item}
        className={`${style.border} ${style.bg} rounded-r-xl px-5 py-4`}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          <Badge variant={style.badge}>{severityLabel(result.severity, lang)}</Badge>
          <span className="ml-auto text-xs tabular-nums text-gray-400 dark:text-gray-500">
            {lang === 'bn' ? `${confidence}% নিশ্চিত` : `${confidence}% confidence`}
          </span>
        </div>

        {/* (b) Diagnosis */}
        <h2 className="mt-1 text-xl font-black leading-tight text-gray-900 dark:text-gray-100 md:text-2xl">
          {result.diagnosis}
        </h2>
      </motion.div>

      {/* (c) Confidence meter */}
      <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {lang === 'bn' ? 'নিশ্চয়তা স্কোর' : 'Confidence Score'}
          </span>
          <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {confidence}%
          </span>
        </div>
        <Progress value={confidence} className={`${style.bar} h-2.5`} />
      </motion.div>

      {/* (d) Recommendation box */}
      <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/50">
            <Info className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {lang === 'bn' ? '✅ আপনার করণীয়' : '✅ Recommended Action'}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {recommendation}
            </p>
          </div>
        </div>
      </motion.div>

      {/* (e) Urgency chip */}
      <motion.div variants={item}>
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${style.bg} ${style.text} ${style.border}`}
        >
          <CalendarClock className="h-4 w-4" />
          {lang === 'bn'
            ? `🗓️ ${result.urgency_days} দিনের মধ্যে ডাক্তার দেখান`
            : `🗓️ See a doctor within ${result.urgency_days} days`}
        </div>
      </motion.div>

      {/* (f) Next steps */}
      {result.next_steps.length > 0 && (
        <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
            {lang === 'bn' ? 'পরবর্তী পদক্ষেপ' : 'Next Steps'}
          </h3>
          <ol className="space-y-2">
            {result.next_steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold tabular-nums text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </motion.div>
      )}

      {/* (g) Specialist badge */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-900/20">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60">
            <Stethoscope className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              {lang === 'bn' ? 'বিশেষজ্ঞ' : 'Specialist Needed'}
            </p>
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              👨‍⚕️ {result.specialist_needed}
            </p>
          </div>
        </div>
      </motion.div>

      {/* (h) Download PDF + Share buttons */}
      <motion.div variants={item} className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90"
        >
          {isDownloading ? (
            <>{lang === 'bn' ? 'তৈরি হচ্ছে...' : 'Generating...'}</>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              {lang === 'bn' ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
            </>
          )}
        </Button>
        <Button onClick={handleShare} variant="outline" className="flex-1 rounded-xl">
          <Share2 className="mr-2 h-4 w-4" />
          {shareStatus ?? (lang === 'bn' ? 'শেয়ার করুন' : 'Share')}
        </Button>
      </motion.div>

      {/* Verified-by-doctor reassurance line for normal results */}
      {result.severity === 'Normal' && (
        <motion.div
          variants={item}
          className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400"
        >
          <CheckCircle2 className="h-4 w-4" />
          {lang === 'bn'
            ? 'আপনার চোখে কোনো গুরুতর সমস্যা পাওয়া যায়নি।'
            : 'No serious eye issues detected.'}
        </motion.div>
      )}
    </motion.div>
  )
}
