'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  Info,
  RefreshCw,
  Share2,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedCounter } from '@/components/shared/AnimatedCounter'
import { AnalysisModeBadge } from '@/components/shared/AnalysisModeBadge'
import { toBengaliDigits } from '@/lib/utils'
import type { Language, NayanResult } from '@/types'
import { severityLabel, severityStyles } from './severity-styles'
import {
  localizeDiagnosis,
  localizeNextStep,
  localizeSpecialist,
} from './diagnosis-localization'

export interface EyeResultCardProps {
  result: NayanResult
  lang: Language
  analysisMode?: 'online' | 'offline' | null
  isUpgrading?: boolean
  variant?: 'full' | 'summary' | 'advice'
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
      damping: 22,
    },
  },
}

/** Clamp confidence to a 0–100 integer for the progress meter. */
function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(Math.round(value), 0), 100)
}

export function EyeResultCard({
  result,
  lang,
  analysisMode,
  isUpgrading,
  variant = 'full',
}: EyeResultCardProps) {
  const style = severityStyles[result.severity]
  const confidence = clampPercent(result.confidence_score)
  const recommendation = lang === 'bn' ? result.recommendation_bn : result.recommendation_en
  const diagnosisInfo = localizeDiagnosis(result.diagnosis, lang)

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
          ? `${toBengaliDigits(result.urgency_days)} দিনের মধ্যে চক্ষু চিকিৎসক দেখান`
          : `See an eye specialist within ${result.urgency_days} days`

      const nextStepsHtml =
        result.next_steps.length > 0
          ? `<div style="margin-bottom: 6px;"><strong style="font-size:12px;color:#555;">${
              lang === 'bn' ? 'করণীয় পদক্ষেপসমূহ' : 'Recommended Next Steps'
            }</strong></div>
             <ol style="margin:0;padding-left:20px;font-size:12px;color:#333;line-height:1.6;">
               ${result.next_steps.map((s) => `<li>${localizeNextStep(s, lang)}</li>`).join('')}
             </ol>`
          : ''

      container.innerHTML = `
        <div style="border-bottom: 2px solid #0EA5E9; padding-bottom: 12px; margin-bottom: 24px;">
          <h1 style="font-size: 26px; color: #0EA5E9; margin: 0;">ShasthyaHub-AI</h1>
          <p style="font-size: 12px; color: #6B7280; margin: 4px 0 0 0;">${lang === 'bn' ? 'নয়ন এআই — চোখের স্ক্রিনিং রিপোর্ট' : 'NayanAI — Eye Screening Report'}</p>
          <p style="font-size: 10px; color: #9CA3AF; margin: 2px 0 0 0;">ID: ${result.id}</p>
          <p style="font-size: 10px; color: #9CA3AF; margin: 2px 0 0 0;">Date: ${new Date().toLocaleString()}</p>
        </div>
        <div style="margin-bottom: 14px;">
          <div style="margin-bottom: 10px;">
            <strong style="font-size:12px;color:#555;">${
              lang === 'bn' ? 'রোগের লক্ষণ / ফলাফল' : 'Diagnosis'
            }</strong>
            <p style="margin:4px 0;font-size:14px;color:#111;font-weight:bold;">${diagnosisInfo.title}</p>
            ${diagnosisInfo.medicalBadge ? `<p style="margin:2px 0;font-size:11px;color:#666;">Medical term: ${diagnosisInfo.medicalBadge}</p>` : ''}
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="font-size:12px;color:#555;">${
              lang === 'bn' ? 'ঝুঁকির মাত্রা' : 'Severity Level'
            }</strong>
            <p style="margin:4px 0;font-size:13px;color:#333;">${severityLabel(result.severity, lang)}</p>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="font-size:12px;color:#555;">${
              lang === 'bn' ? 'এআই নিশ্চয়তা' : 'AI Confidence'
            }</strong>
            <p style="margin:4px 0;font-size:13px;color:#333;">${lang === 'bn' ? toBengaliDigits(confidence) : confidence}%</p>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="font-size:12px;color:#555;">${
              lang === 'bn' ? 'পরামর্শ ও মতামত' : 'Clinical Recommendation'
            }</strong>
            <p style="margin:4px 0;font-size:13px;color:#333;line-height:1.6;">${recommendation}</p>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="font-size:12px;color:#555;">${
              lang === 'bn' ? 'জরুরিতা' : 'Urgency Timeline'
            }</strong>
            <p style="margin:4px 0;font-size:13px;color:#333;">${urgencyText}</p>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="font-size:12px;color:#555;">${
              lang === 'bn' ? 'প্রয়োজনীয় বিশেষজ্ঞ' : 'Recommended Specialist'
            }</strong>
            <p style="margin:4px 0;font-size:13px;color:#333;">${localizeSpecialist(result.specialist_needed, lang)}</p>
          </div>
          ${nextStepsHtml}
        </div>
        <div style="border-top: 1px solid #E5E7EB; padding-top: 12px; text-align: center;">
          <p style="font-size: 10px; color: #9CA3AF; line-height: 1.4; margin: 0;">
            ${lang === 'bn' 
              ? 'এটি একটি কম্পিউটার চালিত এআই স্ক্রিনিং রিপোর্ট, ক্লিনিকাল চূড়ান্ত প্রেসক্রিপশন নয়। স্বাস্থ্য সুরক্ষার স্বার্থে অবিলম্বে একজন নিবন্ধিত চিকিৎসকের পরামর্শ নিন।'
              : 'This document is an automated computer-generated analysis result compiled via an AI screening mechanism. It does not constitute a valid clinical diagnosis or substitute professional medical advice.'}
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
  }, [result, confidence, recommendation, diagnosisInfo, lang])

  const handleShare = useCallback(async () => {
    const shareText =
      lang === 'bn'
        ? `ShasthyaHub নয়ন AI ফলাফল: ${diagnosisInfo.title} (ঝুঁকি: ${severityLabel(
            result.severity,
            'bn'
          )}, ${toBengaliDigits(confidence)}% নিশ্চিত)`
        : `ShasthyaHub NayanAI result: ${result.diagnosis} (${result.severity}, ${confidence}% confidence)`

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
  }, [result, confidence, diagnosisInfo, lang])

  // --- VARIANT 1: ADVICE ONLY (For Right Column) ---
  if (variant === 'advice') {
    return (
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="glass-card rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden transition-all duration-300"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100/80 dark:border-gray-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 dark:bg-sky-400/15 text-sky-600 dark:text-sky-400">
              <ClipboardList className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              {lang === 'bn' ? 'ক্লিনিকাল নির্দেশনা ও করণীয় পদক্ষেপ' : 'Clinical Guidance & Next Steps'}
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-900/40">
            {lang === 'bn' ? 'এআই নির্দেশিত' : 'AI Guided'}
          </span>
        </div>

        {/* AI Recommendation Box */}
        <motion.div
          variants={item}
          className="rounded-2xl border-l-4 border-sky-500 glass-panel p-4 dark:border-sky-400"
        >
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-sky-500/10 dark:bg-sky-400/15 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
              <Info className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                {lang === 'bn' ? 'এআই বিশ্লেষণ ও পরামর্শ' : 'Clinical AI Recommendation'}
              </span>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-medium">
                &ldquo;{recommendation}&rdquo;
              </p>
            </div>
          </div>
        </motion.div>

        {/* Next steps */}
        {result.next_steps.length > 0 && (
          <motion.div variants={item} className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {lang === 'bn' ? 'করণীয় পদক্ষেপসমূহ' : 'Recommended Action Items'}
            </h3>
            <ol className="space-y-2">
              {result.next_steps.map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100/80 dark:border-gray-800/60"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 text-xs font-bold">
                    {lang === 'bn' ? toBengaliDigits(i + 1) : i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 pt-0.5">
                    {localizeNextStep(step, lang)}
                  </span>
                </li>
              ))}
            </ol>
          </motion.div>
        )}

        {/* Specialist needed */}
        <motion.div variants={item}>
          <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                {lang === 'bn' ? 'পরামর্শিত বিশেষজ্ঞ চিকিৎসক' : 'Recommended Specialist'}
              </p>
              <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
                {localizeSpecialist(result.specialist_needed, lang)}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // --- VARIANT 2: SUMMARY REPORT CARD (For Left Column) OR FULL ---
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="glass-card rounded-3xl p-5 sm:p-6 space-y-5 relative overflow-hidden transition-all duration-300"
    >
      {/* Decorative Radial Ambient Glow */}
      <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-gradient-to-br from-sky-400/10 via-cyan-400/5 to-transparent blur-3xl dark:from-sky-400/15" />

      {/* Analysis Mode Badge + Upgrade Indicator */}
      {analysisMode === 'offline' && (
        <motion.div variants={item} className="flex items-center gap-2">
          <AnalysisModeBadge mode="offline" />
          {isUpgrading && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              {lang === 'bn'
                ? 'পূর্ণ অনলাইন বিশ্লেষণ নিশ্চিত করা হচ্ছে...'
                : 'Confirming with full online analysis...'}
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
          className="flex items-center gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 dark:border-amber-800/40 dark:bg-amber-950/30"
        >
          <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200 leading-relaxed">
            {lang === 'bn'
              ? 'এটি একটি প্রাথমিক অফলাইন ফলাফল — পূর্ণ অনলাইন ক্লাউড মডেলের সাথে নিশ্চিত করা হচ্ছে...'
              : 'This is a preliminary offline scan — verifying with online clinical model...'}
          </p>
        </motion.div>
      )}

      {/* Header section with Severity Badge and Scan ID */}
      <motion.div variants={item} className="flex items-center justify-between gap-3">
        <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider ${style.bg} ${style.text} border border-black/5 dark:border-white/10 shadow-sm`}>
          <span className={`h-2 w-2 rounded-full ${style.dot} animate-pulse`} />
          <span>
            {lang === 'bn'
              ? severityLabel(result.severity, 'bn')
              : `${severityLabel(result.severity, 'en').toUpperCase()}`}
          </span>
        </span>
        <span className="font-mono text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider">
          #SCAN-{result.id.slice(0, 8).toUpperCase()}
        </span>
      </motion.div>

      {/* Diagnosis Title & Medical Badge */}
      <motion.div variants={item} className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug text-gray-900 dark:text-gray-100">
          {diagnosisInfo.title}
        </h2>
        {diagnosisInfo.medicalBadge && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-sky-500">Medical:</span>
              <span>{diagnosisInfo.medicalBadge}</span>
            </span>
          </div>
        )}
      </motion.div>

      {/* Confidence Meter Section */}
      <motion.div variants={item} className="space-y-2.5">
        <div className="flex items-end justify-between text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400">
          <span className="uppercase">
            {lang === 'bn' ? 'এআই নির্ভরযোগ্যতা স্কোর' : 'AI Confidence Score'}
          </span>
          <span className="text-lg sm:text-xl font-black tabular-nums text-gray-900 dark:text-gray-100">
            {lang === 'bn' ? (
              <span className="font-bengali">{toBengaliDigits(confidence)}%</span>
            ) : (
              <span><AnimatedCounter value={confidence} duration={1} />%</span>
            )}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100/90 dark:bg-gray-800/90 p-0.5 border border-gray-200/40 dark:border-gray-700/40">
          <motion.div
            className={`h-full rounded-full ${style.bar} shadow-sm`}
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          />
        </div>
      </motion.div>

      {/* Urgency Alert Card */}
      <motion.div variants={item}>
        <div
          className={`flex items-start gap-3.5 rounded-2xl border p-4 ${style.bg} ${style.border} ${style.text} shadow-xs`}
        >
          <div className="p-2 rounded-xl bg-white/70 dark:bg-black/20 shrink-0 mt-0.5 shadow-xs">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="text-sm font-bold leading-relaxed pt-0.5">
            <span>
              {lang === 'bn'
                ? result.urgency_days <= 1
                  ? 'আজই জরুরি ভিত্তিতে একজন চক্ষু বিশেষজ্ঞের পরামর্শ নিন'
                  : `${toBengaliDigits(result.urgency_days)} দিনের মধ্যে চক্ষু বিশেষজ্ঞ চিকিৎসকের পরামর্শ নিন`
                : result.urgency_days <= 1
                  ? 'Consult an eye specialist urgently today'
                  : `Consult an ophthalmologist within ${result.urgency_days} days`}
            </span>
          </div>
        </div>
      </motion.div>

      {/* When variant === 'full', include recommendations and next steps here too */}
      {variant === 'full' && (
        <>
          {/* AI Recommendation Box */}
          <motion.div
            variants={item}
            className="rounded-2xl border-l-4 border-sky-500 glass-panel p-4 dark:border-sky-400"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-sky-500/10 dark:bg-sky-400/15 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
                <Info className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                  {lang === 'bn' ? 'এআই বিশ্লেষণ ও পরামর্শ' : 'Clinical AI Recommendation'}
                </span>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-medium">
                  &ldquo;{recommendation}&rdquo;
                </p>
              </div>
            </div>
          </motion.div>

          {/* Next steps */}
          {result.next_steps.length > 0 && (
            <motion.div variants={item} className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {lang === 'bn' ? 'করণীয় পদক্ষেপসমূহ' : 'Recommended Next Steps'}
              </h3>
              <ol className="space-y-2">
                {result.next_steps.map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100/80 dark:border-gray-800/60"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 text-xs font-bold">
                      {lang === 'bn' ? toBengaliDigits(i + 1) : i + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 pt-0.5">
                      {localizeNextStep(step, lang)}
                    </span>
                  </li>
                ))}
              </ol>
            </motion.div>
          )}

          {/* Specialist needed */}
          <motion.div variants={item}>
            <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  {lang === 'bn' ? 'পরামর্শিত বিশেষজ্ঞ চিকিৎসক' : 'Recommended Specialist'}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {localizeSpecialist(result.specialist_needed, lang)}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Download PDF + Share buttons */}
      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3 pt-1">
        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          variant="outline"
          className="flex-1 rounded-2xl h-11 border-sky-300/80 text-sky-700 hover:bg-sky-50 dark:border-sky-700/60 dark:text-sky-300 dark:hover:bg-sky-950/40 font-bold shadow-xs hover:shadow-md active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {isDownloading ? (
            <span className="text-xs">{lang === 'bn' ? 'রিপোর্ট তৈরি হচ্ছে...' : 'Generating Report...'}</span>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              <span className="text-xs sm:text-sm">{lang === 'bn' ? 'অফিসিয়াল রিপোর্ট ডাউনলোড' : 'Download Clinical PDF'}</span>
            </>
          )}
        </Button>
        <Button
          onClick={handleShare}
          variant="ghost"
          className="flex-1 rounded-2xl h-11 glass-pill text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 font-bold shadow-xs hover:shadow-md active:scale-[0.99] transition-all"
        >
          <Share2 className="mr-2 h-4 w-4" />
          <span className="text-xs sm:text-sm">{shareStatus ?? (lang === 'bn' ? 'ফলাফল শেয়ার করুন' : 'Share Result')}</span>
        </Button>
      </motion.div>

      {/* Reassurance line for normal results */}
      {result.severity === 'Normal' && (
        <motion.div
          variants={item}
          className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 pt-1"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-semibold">
            {lang === 'bn'
              ? 'আপনার চোখে কোনো গুরুতর অসঙ্গতি পাওয়া যায়নি। চোখ সুস্থ রাখুন।'
              : 'No serious ocular abnormality detected. Maintain healthy eye care.'}
          </span>
        </motion.div>
      )}
    </motion.div>
  )
}
