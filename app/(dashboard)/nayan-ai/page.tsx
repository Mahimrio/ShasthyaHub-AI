'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, BookOpen, Eye, Info, RotateCcw, Search } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useNayanAnalysis } from '@/hooks/useNayanAnalysis'
import { useNayanHistory } from '@/hooks/useNayanHistory'
import { useDoctors } from '@/hooks/useDoctors'
import { TopDoctorsCard } from '@/components/features/nayan-ai/TopDoctorsCard'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { DisclaimerModal } from '@/components/shared/DisclaimerModal'
import { AnalyzingAnimation } from '@/components/shared/AnalyzingAnimation'
import { EyeResultCard } from '@/components/features/nayan-ai/EyeResultCard'
import { severityLabel, severityStyles } from '@/components/features/nayan-ai/severity-styles'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ResultCard } from '@/components/shared/ResultCard'
import { formatDate } from '@/lib/utils'

const DISCLAIMER_KEY = 'nayan_disclaimer_seen'

const INSTRUCTIONS = [
  {
    step: 1,
    titleEn: 'Hold phone 15cm',
    titleBn: 'ফোন ১৫ সেমি দূরত্বে রাখুন',
    descEn: 'Hold phone 15cm from eye',
    descBn: 'ফোনটি চোখ থেকে ১৫ সেমি. দূরে রাখুন',
  },
  {
    step: 2,
    titleEn: 'Good lighting',
    titleBn: 'পর্যাপ্ত আলো নিশ্চিত করুন',
    descEn: 'Ensure well-lit environment',
    descBn: 'পর্যাপ্ত আলো নিশ্চিত করুন',
  },
  {
    step: 3,
    titleEn: 'Look straight ahead',
    titleBn: 'সরাসরি তাকান',
    descEn: 'Look straight at the camera',
    descBn: 'সরাসরি ক্যামেরার দিকে তাকান',
  },
]

export default function NayanAIPage() {
  const { lang } = useLanguage()
  const { analyze, result, isLoading, isError, error, reset } = useNayanAnalysis()
  const { history, isLoading: historyLoading } = useNayanHistory()
  const { doctors, isLoading: doctorsLoading } = useDoctors({
    specialty: result?.specialist_needed ?? null,
    enabled: !!result,
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  // Lazily read the "seen" flag at mount. SSR-safe: window is undefined during
  // prerender so it returns false (modal closed), matching the server render.
  // The modal only renders into a portal when open, so no visible hydration mismatch.
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
    // If a file is already chosen, kick off the analysis immediately.
    if (selectedFile) void analyze(selectedFile)
  }, [selectedFile, analyze])

  const handleAnalyzeClick = useCallback(() => {
    if (!selectedFile) return
    const seen = typeof window !== 'undefined' && localStorage.getItem(DISCLAIMER_KEY)
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

  // Stagger animation configurations for steps
  const stepsContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const stepItem = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } }
  }

  return (
    <>
      <DisclaimerModal
        open={showDisclaimer}
        onOpenChange={setShowDisclaimer}
        onAccept={handleAcceptDisclaimer}
      />

      {isLoading && <AnalyzingAnimation />}

      {/* Dynamic Animated Fixed Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-sky-50/60 via-sky-100/30 to-cyan-50/50 dark:from-gray-950 dark:via-sky-950/30 dark:to-cyan-950/20 animate-gradient-bg z-0 motion-reduce:animate-none motion-reduce:bg-gray-50 motion-reduce:dark:bg-gray-950">
        {/* Ambient Radial Gradient Blobs */}
        <div className="absolute -left-32 top-10 h-[700px] w-[700px] rounded-full bg-sky-300/60 dark:bg-sky-500/15 blur-[140px] motion-reduce:hidden animate-float-1" />
        <div className="absolute -right-32 top-40 h-[700px] w-[700px] rounded-full bg-cyan-300/50 dark:bg-cyan-500/15 blur-[140px] motion-reduce:hidden animate-float-2" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[500px] w-[800px] rounded-full bg-blue-200/45 dark:bg-blue-500/10 blur-[160px] motion-reduce:hidden animate-float-3" />
      </div>

      <div className="relative min-h-screen z-10">
        <div className="relative mx-auto max-w-5xl space-y-8 p-4 md:p-6">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 md:text-2xl">
                {lang === 'bn'
                  ? '👁️ নয়ান AI — চোখের পরীক্ষা'
                  : '👁️ NayanAI — Eye Screening'}
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {lang === 'bn'
                  ? 'ডায়াবেটিক রেটিনোপ্যাথি এবং অন্যান্য জটিলতা সনাক্তকরণের জন্য চোখের ছবি আপলোড করুন।'
                  : 'Upload a photo of your eye for automated screening of diabetic retinopathy and other conditions.'}
              </p>
            </div>
          </div>

          {/* Horizontal Instruction Steps */}
          <motion.div 
            variants={stepsContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200/50 bg-white/90 backdrop-blur-sm p-5 shadow-[0_10px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(14,165,233,0.06)] hover:shadow-[0_20px_60px_rgba(14,165,233,0.12),0_8px_24px_rgba(0,0,0,0.08)] hover:border-sky-200 transition-all duration-300 dark:border-gray-700/60 dark:bg-gray-900/90 dark:backdrop-blur-sm dark:shadow-[0_10px_40px_rgba(0,0,0,0.4),0_4px_12px_rgba(14,165,233,0.08)] dark:hover:shadow-[0_20px_60px_rgba(14,165,233,0.15),0_8px_24px_rgba(0,0,0,0.5)] dark:hover:border-sky-800/60 md:grid-cols-3"
          >
            {INSTRUCTIONS.map((item) => (
              <motion.div 
                key={item.step} 
                variants={stepItem}
                className="flex items-start gap-3 group"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-900 text-xs font-bold text-white group-hover:scale-110 transition-transform duration-200">
                  {item.step}
                </span>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {lang === 'bn' ? item.titleBn : item.titleEn}
                  </h4>
                  <p className="text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
                    {lang === 'bn' ? item.descBn : item.descEn}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Interface Grid */}
          <div className={result ? "grid grid-cols-1 gap-8 md:grid-cols-12 items-start" : "mx-auto max-w-2xl space-y-6"}>
            
            {/* Left Column: Image Upload & Trigger */}
            <div className={result ? "md:col-span-5 space-y-4" : "space-y-4"}>
              {/* Floating Upload Card wrapper */}
              <motion.div 
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="w-full"
              >
                <ImageUploader
                  onImageSelect={handleImageSelect}
                  acceptedTypes="image/*"
                  maxSizeMB={5}
                  title={lang === 'bn' ? 'চোখের ছবি আপলোড করুন' : 'Upload Eye Photo'}
                  subtitle={lang === 'bn' ? 'নিশ্চিত করুন যে আইরিসটি কেন্দ্রে রয়েছে এবং ছবিটি স্পষ্ট' : 'Ensure the iris is centered and the image is not blurry for maximum accuracy.'}
                />
              </motion.div>

              {/* Action Trigger Buttons */}
              {!result ? (
                <motion.div
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                >
                  <Button
                    onClick={handleAnalyzeClick}
                    disabled={!selectedFile || isLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-[length:200%_100%] animate-gradient-x py-6 text-base font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.99] transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    {lang === 'bn' ? 'বিশ্লেষণ করুন / ফলাফল দেখুন' : 'Analyze Now / ফলাফল দেখুন'}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                >
                  <Button
                    onClick={handleReset}
                    className="w-full rounded-xl h-12 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
                  >
                    {lang === 'bn' ? 'নতুন ছবি আপলোড করুন' : 'Upload New Image'}
                  </Button>
                </motion.div>
              )}

              {/* Error state */}
              {isError && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>
                    {lang === 'bn' ? 'বিশ্লেষণ ব্যর্থ হয়েছে' : 'Analysis Failed'}
                  </AlertTitle>
                  <AlertDescription>
                    <p className="mb-3 text-xs leading-relaxed">{error}</p>
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
              )}
            </div>

            {/* Right Column: Screen Result Details */}
            {result && (
              <div className="md:col-span-7 space-y-4">
                <EyeResultCard result={result} lang={lang} />

                {/* About This Condition */}
                {(result.disease_description_en || result.disease_description_bn) && (
                  <ResultCard
                    title={lang === 'bn' ? 'এই রোগ সম্পর্কে' : 'About This Condition'}
                    badge={
                      result.disease_stage
                        ? {
                            label: result.disease_stage === 'Advanced'
                              ? (lang === 'bn' ? 'উন্নত পর্যায়' : 'Advanced')
                              : result.disease_stage === 'Moderate'
                                ? (lang === 'bn' ? 'মাঝারি' : 'Moderate')
                                : result.disease_stage === 'Early'
                                  ? (lang === 'bn' ? 'প্রাথমিক' : 'Early')
                                  : result.disease_stage,
                            variant: result.disease_stage === 'Advanced'
                              ? 'destructive'
                              : result.disease_stage === 'Moderate'
                                ? 'secondary'
                                : 'outline',
                          }
                        : undefined
                    }
                  >
                    <div className="space-y-3">
                      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {lang === 'bn'
                          ? result.disease_description_bn
                          : result.disease_description_en}
                      </p>
                      {result.disease_stage === 'Advanced' && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40">
                          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                            {lang === 'bn'
                              ? 'উন্নত পর্যায় শনাক্ত — অবিলম্বে চিকিৎসা নিন'
                              : 'Advanced stage detected — seek treatment immediately'}
                          </p>
                        </div>
                      )}
                    </div>
                  </ResultCard>
                )}

                {/* Top Specialists Nearby */}
                <TopDoctorsCard doctors={doctors} isLoading={doctorsLoading} />
              </div>
            )}
          </div>

          {/* Past history */}
          {!result && (
            <PastAnalyses
              history={history}
              isLoading={historyLoading}
              lang={lang}
            />
          )}

          {/* Bottom disclaimer */}
          <p className="text-center text-[10px] leading-relaxed text-gray-400 dark:text-gray-500 max-w-3xl mx-auto border-t border-gray-50 pt-6 dark:border-gray-800/40">
            {lang === 'bn'
              ? 'DISCLAIMER: ShasthyaHub-AI একটি AI স্ক্রিনিং টুল, ক্লিনিকাল রোগ নির্ণয় নয়। স্বাস্থ্য সংক্রান্ত সিদ্ধান্ত নেওয়ার আগে সর্বদা একজন যোগ্য চিকিৎসকের পরামর্শ নিন।'
              : 'DISCLAIMER: ShasthyaHub-AI is an AI screening tool, not a clinical diagnosis. Always consult a qualified medical professional before making health decisions.'}
          </p>
        </div>
      </div>
    </>
  )
}



// --- Past analyses list -----------------------------------------------------

interface PastAnalysesProps {
  history: ReturnType<typeof useNayanHistory>['history']
  isLoading: boolean
  lang: 'en' | 'bn'
}

function PastAnalyses({ history, isLoading, lang }: PastAnalysesProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
          />
        ))}
      </div>
    )
  }

  if (history.length === 0) return null

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <Info className="h-4 w-4 text-gray-400" />
        {lang === 'bn' ? 'পুরোনো বিশ্লেষণ' : 'Past Analyses'}
      </h3>
      <ul className="space-y-2">
        {history.map((item) => {
          const style =
            item.severity && item.severity in severityStyles
              ? severityStyles[item.severity]
              : null
          return (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                  {item.diagnosis ?? (lang === 'bn' ? 'অজানা' : 'Unknown')}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDate(item.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {style && item.severity && (
                  <Badge variant={style.badge}>{severityLabel(item.severity, lang)}</Badge>
                )}
                {item.confidence_score !== null && (
                  <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500">
                    {Math.round(item.confidence_score)}%
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
