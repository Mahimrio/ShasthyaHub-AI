'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ChevronDown, Eye, Info, RotateCcw, Search, Smartphone } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useNayanAnalysis } from '@/hooks/useNayanAnalysis'
import { useNayanHistory } from '@/hooks/useNayanHistory'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { DisclaimerModal } from '@/components/shared/DisclaimerModal'
import { AnalyzingAnimation } from '@/components/features/nayan-ai/AnalyzingAnimation'
import { EyeResultCard } from '@/components/features/nayan-ai/EyeResultCard'
import { severityLabel, severityStyles } from '@/components/features/nayan-ai/severity-styles'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

const DISCLAIMER_KEY = 'nayan_disclaimer_seen'

const INSTRUCTIONS: { en: string; bn: string }[] = [
  {
    en: 'Hold phone 15–20cm from your eye',
    bn: 'ফোন চোখ থেকে ১৫–২০ সেমি দূরে ধরুন',
  },
  {
    en: 'Use the front camera in a well-lit room',
    bn: 'আলো বেশি এমন ঘরে ফ্রন্ট ক্যামেরা ব্যবহার করুন',
  },
  {
    en: 'Keep your eye wide open and look straight at the camera',
    bn: 'চোখ পুরো খুলে সোজা ক্যামেরার দিকে তাকান',
  },
]

export default function NayanAIPage() {
  const { lang } = useLanguage()
  const { analyze, result, isLoading, isError, error, reset } = useNayanAnalysis()
  const { history, isLoading: historyLoading } = useNayanHistory()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  // Lazily read the "seen" flag at mount. SSR-safe: window is undefined during
  // prerender so it returns false (modal closed), matching the server render.
  // The modal only renders into a portal when open, so no visible hydration mismatch.
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(DISCLAIMER_KEY)
  })
  const [instructionsOpen, setInstructionsOpen] = useState(false)

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

  return (
    <>
      <DisclaimerModal
        open={showDisclaimer}
        onOpenChange={setShowDisclaimer}
        onAccept={handleAcceptDisclaimer}
      />

      {isLoading && <AnalyzingAnimation />}

      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500">
            <Eye className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 md:text-2xl">
              {lang === 'bn' ? '🧿 নয়ান AI — চোখের রোগ শনাক্তকরণ' : '🧿 NayanAI — Eye Disease Detection'}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {lang === 'bn'
                ? 'AI স্ক্রিনিংয়ের জন্য আপনার চোখের ক্লোজ-আপ ছবি আপলোড করুন'
                : 'Upload a close-up photo of your eye for AI screening'}
            </p>
          </div>
        </div>

        {/* Instructions panel (collapsible) */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => setInstructionsOpen((o) => !o)}
            className="flex w-full items-center gap-3 px-5 py-4 text-left"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/50">
              <Smartphone className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
              {lang === 'bn' ? '📱 ভালো চোখের ছবি তোলার নিয়ম' : '📱 How to take a good eye photo'}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${
                instructionsOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {instructionsOpen && (
            <motion.ol
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2 px-5 pb-4"
            >
              {INSTRUCTIONS.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold tabular-nums text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                    {i + 1}
                  </span>
                  {lang === 'bn' ? step.bn : step.en}
                </li>
              ))}
            </motion.ol>
          )}
        </div>

        {/* Upload + analyze (hidden while a result is showing) */}
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
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 py-6 text-base font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search className="mr-2 h-5 w-5" />
              {lang === 'bn' ? 'আমার চোখ বিশ্লেষণ করুন' : '🔍 Analyze My Eye'}
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

        {/* Result */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            <EyeResultCard result={result} lang={lang} />
            <div className="mt-4">
              <Button onClick={handleReset} variant="outline" className="w-full rounded-xl">
                {lang === 'bn' ? 'নতুন ছবি আপলোড করুন' : 'Upload New Image'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Past analyses */}
        {!result && (
          <PastAnalyses
            history={history}
            isLoading={historyLoading}
            lang={lang}
          />
        )}

        {/* Bottom disclaimer */}
        <p className="text-center text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
          {lang === 'bn'
            ? 'ShasthyaHub-AI একটি AI স্ক্রিনিং টুল, ক্লিনিকাল রোগ নির্ণয় নয়। স্বাস্থ্য সংক্রান্ত সিদ্ধান্ত নেওয়ার আগে সর্বদা একজন যোগ্য চিকিৎসকের পরামর্শ নিন।'
            : 'ShasthyaHub-AI is an AI screening tool, not a clinical diagnosis. Always consult a qualified medical professional before making health decisions.'}
        </p>
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
