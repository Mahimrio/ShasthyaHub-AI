'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ClipboardList,
  Info,
  Lightbulb,
  RotateCcw,
  Search,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useScriptGuardAnalysis } from '@/hooks/useScriptGuardAnalysis'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { DisclaimerModal } from '@/components/shared/DisclaimerModal'
import { AnalyzingAnimation } from '@/components/shared/AnalyzingAnimation'
import { ResultCard } from '@/components/shared/ResultCard'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AnalysisModeBadge } from '@/components/shared/AnalysisModeBadge'
import ExtractedMedsTable from '@/components/features/scriptguard/ExtractedMedsTable'
import DrugInteractionAlert from '@/components/features/scriptguard/DrugInteractionAlert'
import MedicationScheduleTimeline from '@/components/features/scriptguard/MedicationScheduleTimeline'
import AudioGuide from '@/components/features/scriptguard/AudioGuide'

const DISCLAIMER_KEY = 'scriptguard_disclaimer_seen'

export default function ScriptGuardPage() {
  const { lang } = useLanguage()
  const { isOnline } = useNetworkStatus()
  const { analyze, result, isLoading, isError, error, reset, mode, offlineStatus } =
    useScriptGuardAnalysis()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  // SSR-safe: closed during prerender (window undefined), opens after mount
  // if the disclaimer hasn't been accepted yet.
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(DISCLAIMER_KEY)
  })

  const handleImageSelect = useCallback((file: File) => {
    setSelectedFile(file)
  }, [])

  const handleAcceptDisclaimer = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.setItem(DISCLAIMER_KEY, '1')
    setShowDisclaimer(false)
    // Kick off analysis if a file was already chosen before accepting.
    if (selectedFile) void analyze(selectedFile)
  }, [selectedFile, analyze])

  const handleAnalyzeClick = useCallback(() => {
    if (!selectedFile) return
    const seen =
      typeof window !== 'undefined' && localStorage.getItem(DISCLAIMER_KEY)
    if (!seen) {
      setShowDisclaimer(true)
      return
    }
    void analyze(selectedFile)
  }, [selectedFile, analyze])

  const handleReset = useCallback(() => {
    reset()
    setSelectedFile(null)
  }, [reset])

  const specialInstructions =
    lang === 'bn'
      ? result?.special_instructions_bn ?? []
      : result?.special_instructions_en ?? []

  const scriptGuardStages = [
    { en: '📡 Sending prescription to Vision Engine...', bn: '📡 প্রেসক্রিপশন ভিশন ইঞ্জিনে পাঠানো হচ্ছে...' },
    { en: '🔍 Extracting medication details...', bn: '🔍 ওষুধের তথ্য বের করা হচ্ছে...' },
    { en: '⚕️ Checking drug interactions...', bn: '⚕️ ওষুধের মিথস্ক্রিয়া যাচাই করা হচ্ছে...' },
    { en: '📋 Generating schedule & report...', bn: '📋 সময়সূচি ও রিপোর্ট তৈরি হচ্ছে...' },
    { en: '✅ Almost done...', bn: '✅ প্রায় শেষ...' },
  ]

  return (
    <>
      <DisclaimerModal
        open={showDisclaimer}
        onOpenChange={setShowDisclaimer}
        onAccept={handleAcceptDisclaimer}
      />

      {isLoading && (
        <AnalyzingAnimation
          stages={scriptGuardStages}
          icon={
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
              <ClipboardList className="h-10 w-10 text-white" />
            </div>
          }
        />
      )}

      {/* Dynamic Animated Fixed Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/20 dark:from-gray-950 dark:via-emerald-950/30 dark:to-teal-950/20 animate-gradient-bg z-0 motion-reduce:animate-none motion-reduce:bg-gray-50 motion-reduce:dark:bg-gray-950">
        {/* Ambient Radial Gradient Blobs */}
        <div className="absolute -left-32 top-10 h-[700px] w-[700px] rounded-full bg-emerald-300/40 dark:bg-emerald-500/20 blur-[140px] motion-reduce:hidden animate-float-1" />
        <div className="absolute -right-32 top-40 h-[700px] w-[700px] rounded-full bg-teal-300/35 dark:bg-teal-500/20 blur-[140px] motion-reduce:hidden animate-float-2" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[500px] w-[800px] rounded-full bg-cyan-200/25 dark:bg-cyan-600/15 blur-[160px] motion-reduce:hidden animate-float-3" />
      </div>

      <div className="relative min-h-screen z-10">
        <div className="relative z-10 mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
            <ClipboardList className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 md:text-2xl">
              {lang === 'bn'
                ? '📋 স্ক্রিপ্টগার্ড — প্রেসক্রিপশন চেকার'
                : '📋 ScriptGuard — Prescription Checker'}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {lang === 'bn'
                ? 'যেকোনো প্রেসক্রিপশনের ছবি আপলোড করুন — ওষুধ শনাক্তকরণ, মিথস্ক্রিয়া যাচাই ও ডিজিটাল শিডিউল তৈরি।'
                : 'Upload a photo of any handwritten prescription for an instant drug safety check.'}
            </p>
          </div>
        </div>

        {/* Photo tip box */}
        {!result && (
          <div className="flex items-start gap-3 rounded-2xl border border-gray-200/50 bg-white/90 backdrop-blur-sm p-4 dark:border-gray-700/60 dark:bg-gray-900/90 dark:backdrop-blur-sm shadow-[0_10px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(16,185,129,0.06)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4),0_4px_12px_rgba(16,185,129,0.08)]">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
            <p className="text-xs leading-relaxed text-sky-800 dark:text-sky-200">
              {lang === 'bn'
                ? '💡 টিপ: সেরা ফলাফলের জন্য ভালো আলোতে প্রেসক্রিপশনটি সমতল পৃষ্ঠে রেখে ছবি তুলুন।'
                : '💡 Tip: For best results, take the photo in good lighting with the prescription flat on a surface.'}
            </p>
          </div>
        )}

        {/* Offline fallback info */}
        {!isOnline && offlineStatus !== 'idle' && offlineStatus !== 'ready' && !result && (
          <Alert className="rounded-2xl border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              {lang === 'bn' ? 'অফলাইন অবস্থা' : 'Offline Status'}
            </AlertTitle>
            <AlertDescription className="text-xs text-amber-700 dark:text-amber-300">
              {offlineStatus === 'missing'
                ? lang === 'bn'
                  ? 'অফলাইন OCR এই ডিভাইসে সেট আপ করা হয়নি — ইন্টারনেটে সংযুক্ত হন।'
                  : 'Offline OCR isn\'t set up on this device yet — connect to the internet for analysis.'
                : offlineStatus === 'unsupported'
                  ? lang === 'bn'
                    ? 'অফলাইন AI এই ডিভাইসে সমর্থিত নয় — অনুগ্রহ করে বিশ্লেষণের জন্য ইন্টারনেটে সংযুক্ত হন।'
                    : 'Offline AI isn\'t supported on this device — please connect to the internet for analysis.'
                  : ''}
            </AlertDescription>
          </Alert>
        )}

        {/* Upload + analyze button (hidden once a result is showing) */}
        {!result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <ImageUploader
              onImageSelect={handleImageSelect}
              acceptedTypes="image/*"
              maxSizeMB={5}
            />
            <Button
              onClick={handleAnalyzeClick}
              disabled={!selectedFile || isLoading}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-[length:200%_100%] animate-gradient-x py-6 text-base font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.99] transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search className="mr-2 h-5 w-5" />
              {lang === 'bn' ? 'প্রেসক্রিপশন বিশ্লেষণ করুন' : 'Analyze Prescription'}
            </Button>
          </motion.div>
        )}

        {/* Error state */}
        {isError && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {lang === 'bn' ? 'বিশ্লেষণ ব্যর্থ হয়েছে' : 'Analysis Failed'}
              </AlertTitle>
              <AlertDescription>
                <p className="mb-3">{error}</p>
                <Button
                  onClick={handleAnalyzeClick}
                  variant="outline"
                  size="sm"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Try Again'}
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Result — render in safety order: interactions → drugs → schedule → audio */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Mode badge */}
            <div className="flex justify-end">
              {mode && <AnalysisModeBadge mode={mode} />}
            </div>

            {/* 1. Drug interactions (FIRST for safety) */}
            <DrugInteractionAlert
              interactions={result.interaction_warnings}
              hasDangerous={result.has_dangerous_interactions}
              lang={lang}
              unavailable={mode === 'offline'}
            />

            {/* 2. Extracted medications */}
            <ResultCard
              title={lang === 'bn' ? 'শনাক্তকৃত ওষুধ' : 'Identified Medications'}
              badge={{
                label: `${result.extracted_drugs.length} ${
                  lang === 'bn' ? 'টি' : 'drugs'
                }`,
                variant: 'normal',
              }}
            >
              <div className="pt-3">
                <ExtractedMedsTable drugs={result.extracted_drugs} lang={lang} mode={mode ?? undefined} />
              </div>
            </ResultCard>

            {/* 3. Medication schedule timeline */}
            <ResultCard
              title={lang === 'bn' ? 'ওষুধ গ্রহণের সময়সূচি' : 'Medication Schedule'}
              badge={{ label: lang === 'bn' ? 'প্রতিদিন' : 'Daily', variant: 'low' }}
            >
              <div className="pt-3">
                <MedicationScheduleTimeline
                  schedule={result.schedule}
                  durationDays={result.duration_days}
                  specialInstructions={specialInstructions}
                  lang={lang}
                />
              </div>
            </ResultCard>

            {/* 4. Audio guide */}
            <AudioGuide audioScriptBn={result.audio_script_bn} lang={lang} />

            {/* Reset */}
            <Button
              onClick={handleReset}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-[length:200%_100%] animate-gradient-x text-white font-semibold shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {lang === 'bn'
                ? 'নতুন প্রেসক্রিপশন স্ক্যান করুন'
                : 'Scan New Prescription'}
            </Button>
          </motion.div>
        )}

        {/* Bottom disclaimer */}
        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
          <Info className="h-3 w-3 shrink-0" />
          {lang === 'bn'
            ? 'ScriptGuard একটি সহায়ক টুল, চিকিৎসকের পরামর্শের বিকল্প নয়। ওষুধ পরিবর্তনের আগে অবশ্যই ডাক্তারের সাথে পরামর্শ করুন।'
            : 'ScriptGuard is a supportive tool, not a substitute for a doctor. Always consult a physician before changing any medication.'}
        </p>
      </div>
      </div>
    </>
  )
}
