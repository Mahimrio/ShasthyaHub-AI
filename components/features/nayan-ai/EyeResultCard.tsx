'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import {
  CalendarClock,
  CheckCircle2,
  Download,
  Info,
  RefreshCw,
  Share2,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AnalysisModeBadge } from '@/components/shared/AnalysisModeBadge'
import type { Language, NayanResult } from '@/types'
import { severityLabel, severityStyles } from './severity-styles'

interface EyeResultCardProps {
  result: NayanResult
  lang: Language
  analysisMode?: 'online' | 'offline' | null
  isUpgrading?: boolean
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
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 22
    }
  },
}

/** Clamp confidence to a 0–100 integer for the progress meter. */
function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(Math.round(value), 0), 100)
}

export function EyeResultCard({ result, lang, analysisMode, isUpgrading }: EyeResultCardProps) {
  const style = severityStyles[result.severity]
  const confidence = clampPercent(result.confidence_score)
  const recommendation = lang === 'bn' ? result.recommendation_bn : result.recommendation_en

  const [isDownloading, setIsDownloading] = useState(false)
  const [shareStatus, setShareStatus] = useState<string | null>(null)

  const handleDownload = useCallback(async () => {
    setIsDownloading(true)
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '-9999px'
      container.style.width = '790px'
      container.style.padding = '40px'
      container.style.backgroundColor = '#FFFFFF'
      container.style.color = '#111111'
      container.style.fontFamily = 'sans-serif'

      const urgencyText =
        lang === 'bn'
          ? `${result.urgency_days} দিনের মধ্যে ডাক্তার দেখান`
          : `See a doctor within ${result.urgency_days} days`

      const nextStepsHtml =
        result.next_steps.length > 0
          ? `<div style="margin-bottom: 6px;"><strong style="font-size:12px;color:#555;">${
              lang === 'bn' ? 'পরবর্তী পদক্ষেপ' : 'Next Steps'
            }</strong></div>
             <ol style="margin:0;padding-left:20px;font-size:12px;color:#333;line-height:1.6;">
               ${result.next_steps.map((s) => `<li>${s}</li>`).join('')}
             </ol>`
          : ''

      container.innerHTML = `
        <div style="border-bottom: 2px solid #2563EB; padding-bottom: 12px; margin-bottom: 24px;">
          <h1 style="font-size: 26px; color: #2563EB; margin: 0;">ShasthyaHub-AI</h1>
          <p style="font-size: 12px; color: #6B7280; margin: 4px 0 0 0;">NayanAI — Eye Screening Report</p>
          <p style="font-size: 10px; color: #9CA3AF; margin: 2px 0 0 0;">ID: ${result.id}</p>
          <p style="font-size: 10px; color: #9CA3AF; margin: 2px 0 0 0;">Date: ${new Date().toLocaleString()}</p>
        </div>
        <div style="margin-bottom: 14px;">
          <div style="margin-bottom: 10px;">
            <strong style="font-size:12px;color:#555;">${
              lang === 'bn' ? 'রোগ নির্ণয়' : 'Diagnosis'
            }</strong>
            <p style="margin:4px 0;font-size:13px;color:#333;">${result.diagnosis}</p>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="font-size:12px;color:#555;">${
              lang === 'bn' ? 'গুরুত্ব' : 'Severity'
            }</strong>
            <p style="margin:4px 0;font-size:13px;color:#333;">${severityLabel(result.severity, lang)}</p>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="font-size:12px;color:#555;">${
              lang === 'bn' ? 'নিশ্চয়তা' : 'Confidence'
            }</strong>
            <p style="margin:4px 0;font-size:13px;color:#333;">${confidence}%</p>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="font-size:12px;color:#555;">${
              lang === 'bn' ? 'সুপারিশ' : 'Recommendation'
            }</strong>
            <p style="margin:4px 0;font-size:13px;color:#333;line-height:1.6;">${recommendation}</p>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="font-size:12px;color:#555;">${
              lang === 'bn' ? 'জরুরিতা' : 'Urgency'
            }</strong>
            <p style="margin:4px 0;font-size:13px;color:#333;">${urgencyText}</p>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="font-size:12px;color:#555;">${
              lang === 'bn' ? 'প্রয়োজনীয় বিশেষজ্ঞ' : 'Specialist Needed'
            }</strong>
            <p style="margin:4px 0;font-size:13px;color:#333;">${result.specialist_needed}</p>
          </div>
          ${nextStepsHtml}
        </div>
        <div style="border-top: 1px solid #E5E7EB; padding-top: 12px; text-align: center;">
          <p style="font-size: 10px; color: #9CA3AF; line-height: 1.4; margin: 0;">
            This document is an automated computer-generated analysis result compiled via an AI screening mechanism.
            It does not constitute a valid clinical diagnosis or substitute professional medical advice.
            Please share with a certified medical doctor.
          </p>
        </div>
      `

      document.body.appendChild(container)

      const canvas = await html2canvas(container, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      document.body.removeChild(container)

      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= 297

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= 297
      }

      pdf.save(`nayanai-report-${result.id.slice(0, 8)}.pdf`)
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
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="rounded-2xl border border-gray-200/50 bg-white/90 backdrop-blur-sm p-6 dark:border-gray-700/60 dark:bg-gray-900/90 dark:backdrop-blur-sm space-y-5 shadow-[0_10px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(14,165,233,0.06)] hover:shadow-[0_20px_60px_rgba(14,165,233,0.14),0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4),0_4px_12px_rgba(14,165,233,0.08)] dark:hover:shadow-[0_20px_60px_rgba(14,165,233,0.18),0_8px_24px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden"
    >
      {/* Decorative Radial Inner Glow */}
      <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-gradient-to-br from-sky-400/8 to-transparent blur-2xl dark:from-sky-400/15" />

      {/* Analysis Mode Badge + Upgrade Indicator */}
      {analysisMode === 'offline' && (
        <motion.div variants={item} className="flex items-center gap-2">
          <AnalysisModeBadge mode="offline" />
          {isUpgrading && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              {lang === 'bn'
                ? 'পূর্ণ বিশ্লেষণ নিশ্চিত করা হচ্ছে...'
                : 'Confirming with full analysis...'}
            </span>
          )}
        </motion.div>
      )}
      {analysisMode === 'online' && (
        <motion.div variants={item}>
          <AnalysisModeBadge mode="online" />
        </motion.div>
      )}

      {/* Background upgrade-in-progress banner */}
      {analysisMode === 'offline' && isUpgrading && (
        <motion.div
          variants={item}
          className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/20"
        >
          <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
            {lang === 'bn'
              ? 'এটি একটি প্রাথমিক অফলাইন ফলাফল — পূর্ণ বিশ্লেষণের সাথে নিশ্চিত করা হচ্ছে...'
              : 'This is a preliminary offline read — confirming with full analysis...'}
          </p>
        </motion.div>
      )}

      {/* Header section with Severity Badge and Scan ID */}
      <motion.div variants={item} className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${style.bg} ${style.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot} animate-pulse-slow`} />
          {lang === 'bn'
            ? `${result.severity === 'Normal' ? 'NORMAL' : result.severity === 'Low' ? 'LOW RISK' : result.severity === 'Medium' ? 'MEDIUM RISK' : result.severity === 'High' ? 'HIGH RISK' : 'CRITICAL'} — ${severityLabel(result.severity, 'bn')}`
            : `${result.severity === 'Normal' ? 'NORMAL' : result.severity === 'Low' ? 'LOW RISK' : result.severity === 'Medium' ? 'MEDIUM RISK' : result.severity === 'High' ? 'HIGH RISK' : 'CRITICAL'} — ${severityLabel(result.severity, 'en')}`}
        </span>
        <span className="font-mono text-xs text-gray-400 tracking-wider">
          #SCAN-{result.id.slice(0, 8).toUpperCase()}
        </span>
      </motion.div>

      {/* Diagnosis Title */}
      <motion.div variants={item}>
        <h2 className="text-2xl font-black tracking-tight leading-tight text-gray-900 dark:text-gray-100">
          {result.diagnosis}
        </h2>
      </motion.div>

      {/* Confidence Meter Section */}
      <motion.div variants={item} className="space-y-2">
        <div className="flex items-end justify-between text-[11px] font-bold tracking-wider text-gray-400 dark:text-gray-500">
          <span>AI CONFIDENCE / নির্ভরযোগ্যতা</span>
          <span className="text-lg font-black tabular-nums text-gray-900 dark:text-gray-100">
            {confidence}%
          </span>
        </div>
        <Progress value={confidence} className={`${style.bar} h-2`} />
      </motion.div>

      {/* Urgency Alert Card */}
      <motion.div variants={item}>
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 ${style.bg} ${style.border} ${style.text}`}
        >
          <CalendarClock className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm font-bold leading-snug">
            <span>
              See doctor within {result.urgency_days} days / {result.urgency_days} দিনের মধ্যে ডাক্তার দেখান
            </span>
          </div>
        </div>
      </motion.div>

      {/* AI Recommendation / Details Box */}
      <motion.div
        variants={item}
        className="rounded-xl border-l-4 border-sky-500 bg-sky-50/20 p-4 dark:border-sky-500 dark:bg-sky-950/20"
      >
        <div className="flex items-start gap-2.5">
          <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
              {lang === 'bn' ? 'এআই মতামত / AI Recommendation' : 'AI Recommendation / এআই মতামত'}
            </span>
            <p className="mt-1 text-sm font-medium italic leading-relaxed text-gray-700 dark:text-gray-300">
              &ldquo;{recommendation}&rdquo;
            </p>
          </div>
        </div>
      </motion.div>

      {/* Next steps */}
      {result.next_steps.length > 0 && (
        <motion.div variants={item} className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {lang === 'bn' ? 'পরবর্তী পদক্ষেপ / Next Steps' : 'Next Steps / পরবর্তী পদক্ষেপ'}
          </h3>
          <ol className="space-y-2">
            {result.next_steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </motion.div>
      )}

      {/* Specialist needed */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/20 p-4 dark:border-emerald-950/50 dark:bg-emerald-950/20">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <Stethoscope className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              {lang === 'bn' ? 'প্রয়োজনীয় চিকিৎসক / Specialist' : 'Specialist / প্রয়োজনীয় চিকিৎসক'}
            </p>
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              👨‍⚕️ {result.specialist_needed}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Download PDF + Share buttons */}
      <motion.div variants={item} className="flex gap-3 pt-2">
        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          variant="outline"
          className="flex-1 rounded-xl h-11 border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950/40 dark:hover:text-sky-200 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {isDownloading ? (
            <span className="text-xs">{lang === 'bn' ? 'তৈরি হচ্ছে...' : 'Generating...'}</span>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              <span className="text-xs font-semibold">{lang === 'bn' ? 'রিপোর্ট ডাউনলোড করুন' : 'Download Report'}</span>
            </>
          )}
        </Button>
        <Button
          onClick={handleShare}
          variant="ghost"
          className="flex-1 rounded-xl h-11 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 active:scale-[0.99] transition-all"
        >
          <Share2 className="mr-2 h-4 w-4" />
          <span className="text-xs font-semibold">{shareStatus ?? (lang === 'bn' ? 'শেয়ার করুন' : 'Share Data')}</span>
        </Button>
      </motion.div>

      {/* Verified-by-doctor reassurance line for normal results */}
      {result.severity === 'Normal' && (
        <motion.div
          variants={item}
          className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 pt-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-medium">
            {lang === 'bn'
              ? 'আপনার চোখে কোনো গুরুতর সমস্যা পাওয়া যায়নি।'
              : 'No serious eye issues detected.'}
          </span>
        </motion.div>
      )}
    </motion.div>
  )
}
