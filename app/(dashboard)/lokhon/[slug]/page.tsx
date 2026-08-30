'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronLeft, ChevronRight, ClipboardCheck, RotateCcw, Search } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLokhonAnalysis } from '@/hooks/useLokhonAnalysis'
import { DisclaimerModal } from '@/components/shared/DisclaimerModal'
import { AnalyzingAnimation } from '@/components/shared/AnalyzingAnimation'
import { LikertScale } from '@/components/features/lokhon/LikertScale'
import { QuestionProgress } from '@/components/features/lokhon/QuestionProgress'
import { LokhonResultCard } from '@/components/features/lokhon/LokhonResultCard'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import type { LokhonQuestion, LokhonDisease, LokhonAnswer } from '@/types'

const LOKHON_STAGES = [
  { en: '📋 Processing your answers...', bn: '📋 আপনার উত্তর প্রক্রিয়াকরণ করা হচ্ছে...' },
  { en: '🔬 Analyzing symptom patterns...', bn: '🔬 লক্ষণের প্যাটার্ন বিশ্লেষণ করা হচ্ছে...' },
  { en: '🧠 Generating risk assessment...', bn: '🧠 ঝুঁকি মূল্যায়ন তৈরি করা হচ্ছে...' },
  { en: '✅ Preparing your report...', bn: '✅ আপনার রিপোর্ট তৈরি করা হচ্ছে...' },
]



const DISCLAIMER_KEY = 'lokhon_disclaimer_seen'

const slideVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

export default function LokhonQuestionnairePage() {
  const { lang } = useLanguage()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const { analyze, result, isLoading, isError, error, reset } = useLokhonAnalysis()

  const [disease, setDisease] = useState<LokhonDisease | null>(null)
  const [questions, setQuestions] = useState<LokhonQuestion[]>([])
  const [loadingDisease, setLoadingDisease] = useState(true)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(DISCLAIMER_KEY)
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/lokhon/diseases')
        const json = await res.json()
        if (json.success && json.data) {
          const found = json.data.diseases?.find((d: LokhonDisease) => d.slug === slug)
          setDisease(found ?? null)

          const diseaseQuestions = (json.data.questions ?? [])
            .filter((q: LokhonQuestion) => q.disease_slug === slug)
            .sort((a: LokhonQuestion, b: LokhonQuestion) => a.order_index - b.order_index)
          setQuestions(diseaseQuestions)
        }
      } catch {
        // silent
      } finally {
        setLoadingDisease(false)
      }
    }
    fetchData()

    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) fetchData()
    }
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
  }, [slug])

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1
  const progress = Object.keys(answers).length

  const handleAnswer = useCallback((value: number) => {
    if (!currentQuestion) return
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
  }, [currentQuestion])

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
    }
  }, [currentIndex, questions.length])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
    }
  }, [currentIndex])

  const handleAcceptDisclaimer = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.setItem(DISCLAIMER_KEY, '1')
    setShowDisclaimer(false)
  }, [])

  const handleAnalyze = useCallback(() => {
    const answerArray: LokhonAnswer[] = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value,
    }))
    void analyze(slug, answerArray)
  }, [answers, slug, analyze])

  const handleReset = useCallback(() => {
    reset()
    setAnswers({})
    setCurrentIndex(0)
  }, [reset])

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined)

  if (loadingDisease) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 w-80 animate-pulse rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
            />
          ))}
        </div>
      </div>
    )
  }

  if (!disease && !loadingDisease) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Search className="h-10 w-10 mx-auto mb-3 text-gray-400" />
          <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
            {lang === 'bn' ? 'স্ক্রিনিং মডিউল পাওয়া যায়নি' : 'Screening Not Found'}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {lang === 'bn' ? 'এই রোগের জন্য কোনো প্রশ্ন পাওয়া যায়নি।' : 'No questions found for this disease.'}
          </p>
          <Button onClick={() => router.replace('/lokhon')} variant="outline" className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {lang === 'bn' ? 'ফিরে যান' : 'Go Back'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <DisclaimerModal
        open={showDisclaimer}
        onOpenChange={setShowDisclaimer}
        onAccept={handleAcceptDisclaimer}
      />

      {isLoading && <AnalyzingAnimation stages={LOKHON_STAGES} hideIcon />}

      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-rose-50/60 via-amber-50/30 to-orange-50/50 dark:from-gray-950 dark:via-rose-950/30 dark:to-amber-950/20 animate-gradient-bg z-0 motion-reduce:animate-none">
        <div className="absolute -left-32 top-10 h-[700px] w-[700px] rounded-full bg-rose-300/40 dark:bg-rose-500/20 blur-[140px]" />
        <div className="absolute -right-32 top-40 h-[700px] w-[700px] rounded-full bg-amber-300/35 dark:bg-amber-500/20 blur-[140px]" />
      </div>

      <div className="relative min-h-screen z-10">
        <div className="relative mx-auto max-w-2xl space-y-6 p-4 md:p-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.replace('/lokhon')}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {lang === 'bn' ? disease?.name_bn : disease?.name_en}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {lang === 'bn' ? disease?.description_bn : disease?.description_en}
              </p>
            </div>
          </div>

          {!result ? (
            <>
              {/* Progress */}
              <QuestionProgress current={progress} total={questions.length} />

              {/* Question card */}
              <div className="relative min-h-[240px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion?.id ?? 'empty'}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 dark:backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/60 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(14,165,233,0.06)]"
                  >
                    {currentQuestion && (
                      <div className="space-y-6">
                        <div>
                          <span className="text-xs font-medium text-sky-500 mb-1 block">
                            {lang === 'bn'
                              ? `প্রশ্ন ${currentIndex + 1} / ${questions.length}`
                              : `Question ${currentIndex + 1} of ${questions.length}`}
                          </span>
                          <p className="text-base font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">
                            {lang === 'bn' ? currentQuestion.text_bn : currentQuestion.text_en}
                          </p>
                          {currentQuestion.is_red_flag && (
                            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-rose-500">
                              <AlertTriangle className="h-3 w-3" />
                              {lang === 'bn' ? 'গুরুত্বপূর্ণ প্রশ্ন' : 'Important question'}
                            </span>
                          )}
                        </div>

                        <LikertScale
                          value={answers[currentQuestion.id] ?? null}
                          onChange={handleAnswer}
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between gap-3">
                <Button
                  onClick={handlePrev}
                  disabled={currentIndex === 0 || isLoading}
                  variant="outline"
                  className="rounded-xl px-4"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {lang === 'bn' ? 'পেছনে' : 'Back'}
                </Button>

                {isLastQuestion ? (
                  <Button
                    onClick={handleAnalyze}
                    disabled={!allAnswered || isLoading}
                    className="rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 px-6"
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    {lang === 'bn' ? 'ফলাফল দেখুন' : 'See Results'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={answers[currentQuestion?.id ?? ''] === undefined || isLoading}
                    className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 px-6"
                  >
                    {lang === 'bn' ? 'পরবর্তী' : 'Next'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>

              {/* Error state */}
              {isError && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>
                    {lang === 'bn' ? 'বিশ্লেষণ ব্যর্থ হয়েছে' : 'Analysis Failed'}
                  </AlertTitle>
                  <AlertDescription>
                    <p className="text-xs mb-2">{error}</p>
                    <Button
                      onClick={handleAnalyze}
                      variant="outline"
                      size="sm"
                      className="border-destructive/50 text-destructive"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Try Again'}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Quick-jump dots for larger screens */}
              {questions.length > 1 && (
                <div className="hidden md:flex justify-center gap-1.5">
                  {questions.map((q, i) => {
                    const answered = answers[q.id] !== undefined
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                          i === currentIndex
                            ? 'bg-sky-500 scale-125'
                            : answered
                              ? 'bg-sky-300 dark:bg-sky-600'
                              : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            /* Result view */
            <>
              <LokhonResultCard result={result} lang={lang} />

              <div className="flex gap-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {lang === 'bn' ? 'আবার পরীক্ষা করুন' : 'Retake Test'}
                </Button>
                <Button
                  onClick={() => router.replace('/lokhon')}
                  className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-semibold shadow-md hover:shadow-lg"
                >
                  {lang === 'bn' ? 'অন্য রোগ পরীক্ষা করুন' : 'Check Other Disease'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
