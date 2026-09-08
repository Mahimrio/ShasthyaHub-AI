'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Cpu,
  Download,
  Eye,
  History,
  Lightbulb,
  Phone,
  RotateCcw,
  Scan,
  Search,
  ShieldAlert,
  Sparkles,
  WifiOff,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useNayanAnalysis } from '@/hooks/useNayanAnalysis'
import { useNayanHistory } from '@/hooks/useNayanHistory'
import { useDoctors } from '@/hooks/useDoctors'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { TopDoctorsCard } from '@/components/features/nayan-ai/TopDoctorsCard'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { DisclaimerModal } from '@/components/shared/DisclaimerModal'
import { AnalyzingAnimation } from '@/components/shared/AnalyzingAnimation'
import { EyeResultCard } from '@/components/features/nayan-ai/EyeResultCard'
import { severityLabel, severityStyles } from '@/components/features/nayan-ai/severity-styles'
import { localizeDiagnosis } from '@/components/features/nayan-ai/diagnosis-localization'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ResultCard } from '@/components/shared/ResultCard'
import { PageChat } from '@/components/chat/scoped/PageChat'
import { formatDate, toBengaliDigits } from '@/lib/utils'
import type { NayanResult, ScopedChatContext } from '@/types'

const DISCLAIMER_KEY = 'nayan_disclaimer_seen'

const INSTRUCTIONS = [
  {
    step: 1,
    stepBn: '১',
    titleEn: 'Hold phone 15cm',
    titleBn: 'ফোন ১৫ সেমি দূরত্বে রাখুন',
    descEn: 'Hold phone steady, 15cm from the eye',
    descBn: 'ফোনটি চোখ থেকে ১৫ সেমি দূরত্বে স্থির রাখুন',
  },
  {
    step: 2,
    stepBn: '২',
    titleEn: 'Adequate lighting',
    titleBn: 'পর্যাপ্ত উজ্জ্বল আলো নিশ্চিত করুন',
    descEn: 'Use natural or room light without flash glare',
    descBn: 'কড়া ফ্ল্যাশ এড়িয়ে স্বাভাবিক উজ্জ্বল আলোতে ছবি তুলুন',
  },
  {
    step: 3,
    stepBn: '৩',
    titleEn: 'Look straight ahead',
    titleBn: 'সরাসরি ক্যামেরার দিকে তাকান',
    descEn: 'Keep the eye wide open, iris in center',
    descBn: 'পলক না ফেলে আইরিস ও কর্নিয়া কেন্দ্রে রাখুন',
  },
]

const SCREENED_CONDITIONS = [
  { nameEn: 'Diabetic Retinopathy', nameBn: 'ডায়াবেটিক রেটিনোপ্যাথি', tag: 'High Impact' },
  { nameEn: 'Cataract', nameBn: 'চোখের ছানি (ক্যাটারাক্ট)', tag: 'Common' },
  { nameEn: 'Glaucoma Indicators', nameBn: 'গ্লুকোমার প্রাথমিক লক্ষণ', tag: 'Critical' },
  { nameEn: 'Conjunctivitis', nameBn: 'চোখ ওঠা / কনজাঙ্কটিভাইটিস', tag: 'Infection' },
  { nameEn: 'Pinguecula & Pterygium', nameBn: 'পিংগুয়েকুলা ও মাংস বৃদ্ধি', tag: 'Surface' },
]

export default function NayanAIPage() {
  const { lang } = useLanguage()
  const {
    analyze,
    result,
    setResult,
    isLoading,
    isError,
    error,
    reset,
    analysisMode,
    offlineModelStatus,
    isUpgrading,
  } = useNayanAnalysis()
  const { isOnline } = useNetworkStatus()
  const { history, isLoading: historyLoading } = useNayanHistory()
  const { doctors, isLoading: doctorsLoading } = useDoctors({
    specialty: result?.specialist_needed ?? null,
    enabled: !!result,
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null)

  const handleSelectHistory = useCallback((item: (typeof history)[number]) => {
    if (!item.diagnosis || !item.severity) return
    const fullResult: NayanResult = {
      id: item.id,
      diagnosis: item.diagnosis,
      severity: item.severity,
      recommendation_en: item.recommendation_en || 'Consult an eye specialist for comprehensive assessment.',
      recommendation_bn: item.recommendation_bn || 'বিস্তারিত পরীক্ষার জন্য একজন চক্ষু বিশেষজ্ঞের পরামর্শ নিন।',
      urgency_days: item.urgency_days ?? (item.severity === 'High' || item.severity === 'Critical' ? 7 : 30),
      next_steps: item.next_steps ?? [
        'Consult a certified ophthalmologist for detailed examination.',
        'Monitor blood sugar levels and maintain healthy lifestyle.',
      ],
      specialist_needed: item.specialist_needed || 'Ophthalmologist',
      disease_description_en: item.disease_description_en || undefined,
      disease_description_bn: item.disease_description_bn || undefined,
      disease_stage: item.disease_stage || undefined,
      confidence_score: item.confidence_score ?? 85,
      analysis_mode: 'online',
    }
    setResult(fullResult)
    setSelectedPreviewUrl(null)
  }, [setResult])

  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(DISCLAIMER_KEY)
  })

  const handleImageSelect = useCallback((file: File) => {
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setSelectedPreviewUrl(url)
  }, [])

  const handleAcceptDisclaimer = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.setItem(DISCLAIMER_KEY, '1')
    setShowDisclaimer(false)
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
    if (selectedPreviewUrl) {
      URL.revokeObjectURL(selectedPreviewUrl)
      setSelectedPreviewUrl(null)
    }
  }, [reset, selectedPreviewUrl])

  // Paperclip in the chat composer: swap the photo and screen it straight away.
  const handleChatAttach = useCallback(
    (file: File) => {
      handleImageSelect(file)
      const seen = typeof window !== 'undefined' && localStorage.getItem(DISCLAIMER_KEY)
      if (!seen) {
        setShowDisclaimer(true)
        return
      }
      void analyze(file)
    },
    [handleImageSelect, analyze]
  )

  const getChatContext = useCallback((): ScopedChatContext | null => {
    if (!result) return null
    return {
      agent: 'nayan',
      diagnosis: result.diagnosis,
      severity: result.severity,
      confidence_score: result.confidence_score,
      recommendation_en: result.recommendation_en,
      urgency_days: result.urgency_days,
      next_steps: result.next_steps ?? [],
      specialist_needed: result.specialist_needed,
      disease_description_en: result.disease_description_en,
      disease_stage: result.disease_stage,
      analysis_mode: result.analysis_mode ?? analysisMode ?? 'online',
    }
  }, [result, analysisMode])

  const chatContextLabel = result
    ? `${localizeDiagnosis(result.diagnosis, lang).title} · ${severityLabel(result.severity, lang)}`
    : undefined

  return (
    <>
      <DisclaimerModal
        open={showDisclaimer}
        onOpenChange={setShowDisclaimer}
        onAccept={handleAcceptDisclaimer}
      />

      {isLoading && <AnalyzingAnimation />}

      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-sky-50/50 via-cyan-50/30 to-blue-50/40 dark:from-gray-950 dark:via-sky-950/20 dark:to-cyan-950/15 animate-gradient-bg z-0 motion-reduce:animate-none">
        <div className="absolute -left-20 top-10 h-[650px] w-[650px] rounded-full bg-sky-300/40 dark:bg-sky-500/10 blur-[130px] motion-reduce:hidden animate-float-1" />
        <div className="absolute -right-20 top-40 h-[650px] w-[650px] rounded-full bg-cyan-300/35 dark:bg-cyan-500/10 blur-[130px] motion-reduce:hidden animate-float-2" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[450px] w-[750px] rounded-full bg-blue-200/30 dark:bg-blue-500/10 blur-[150px] motion-reduce:hidden animate-float-3" />
      </div>

      <div className="relative min-h-screen z-10">
        <div className="relative mx-auto max-w-[1460px] 2xl:max-w-[1560px] space-y-7 p-4 sm:p-6 lg:p-8">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
            <div className="flex items-start gap-3.5">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 via-cyan-500 to-emerald-500 text-white shadow-md shadow-sky-500/15">
                <Eye className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                    {lang === 'bn' ? 'নয়ন AI — চোখের স্ক্রিনিং' : 'Nayan AI — Eye Screening'}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-sky-100/80 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300/50 dark:border-sky-800/40 shadow-xs">
                    <Sparkles className="h-3 w-3 text-sky-500" />
                    <span>{lang === 'bn' ? 'বায়োমেট্রিক দৃষ্টি বিশ্লেষণ' : 'Vision Intelligence'}</span>
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 max-w-2xl font-normal">
                  {lang === 'bn'
                    ? 'ডায়াবেটিক রেটিনোপ্যাথি, ছানি এবং অন্যান্য সাধারণ চোখের জটিলতা প্রাথমিক সনাক্তকরণের জন্য চোখের স্পষ্ট ছবি আপলোড করুন।'
                    : 'Automated AI vision screening for diabetic retinopathy, cataracts, and common anterior eye conditions.'}
                </p>
              </div>
            </div>

            {result && (
              <Button
                onClick={handleReset}
                variant="outline"
                className="self-start sm:self-center rounded-xl glass-pill hover:bg-sky-50 dark:hover:bg-sky-950/50 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-medium cursor-pointer"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                <span>{lang === 'bn' ? 'নতুন ছবি আপলোড' : 'Upload New'}</span>
              </Button>
            )}
          </div>

          {/* MAIN WORKSPACE GRID */}
          {!result ? (
            /* PRE-ANALYSIS / UPLOAD STATE: Balanced 2-Column Console (50/50 matching result state) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              
              {/* Left Column (Upload & Scanner Frame) */}
              <div className="lg:col-span-6 xl:col-span-6 space-y-4">
                <div className="glass-card rounded-3xl p-5 sm:p-7 space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-100/80 dark:border-gray-800/80 pb-3.5">
                    <div className="flex items-center gap-2">
                      <Scan className="h-4 w-4 text-sky-500" />
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {lang === 'bn' ? 'বায়োমেট্রিক অপটিক্যাল স্ক্যানার' : 'Biometric Ocular Console'}
                      </h3>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-900/40">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{lang === 'bn' ? 'অনলাইন মডেল প্রস্তুত' : 'AI Engine Ready'}</span>
                    </span>
                  </div>

                  <ImageUploader
                    onImageSelect={handleImageSelect}
                    acceptedTypes="image/*"
                    maxSizeMB={5}
                    title={lang === 'bn' ? 'চোখের স্পষ্ট ছবি নির্বাচন করুন' : 'Upload or Capture Eye Photo'}
                    subtitle={lang === 'bn' ? 'আইরিস ও কর্নিয়া কেন্দ্রে রেখে ছবিটি স্পষ্ট ও ফোকাসে রাখুন' : 'Ensure iris & cornea are centered and in sharp focus'}
                    readyText={lang === 'bn' ? 'চোখের আইরিস ও কর্নিয়া স্পষ্ট রয়েছে' : 'Eye image ready for AI biometric analysis'}
                  />

                  {/* Offline Warning Banners */}
                  {!isOnline && offlineModelStatus === 'missing' && (
                    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 dark:border-amber-800/50 dark:bg-amber-950/30">
                      <div className="flex items-start gap-3">
                        <Download className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                            {lang === 'bn' ? 'অফলাইন মডেল উপলব্ধ নয়' : 'Offline Model Not Cached'}
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-normal">
                            {lang === 'bn'
                              ? 'এই ডিভাইসে অফলাইন মডেলটি সেভ করা নেই — অনুগ্রহ করে ইন্টারনেটে সংযুক্ত হন।'
                              : 'Connect to the internet to run clinical analysis.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isOnline && offlineModelStatus === 'unsupported' && (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                      <div className="flex items-start gap-3">
                        <Cpu className="mt-0.5 h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" />
                        <div>
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                            {lang === 'bn' ? 'ডিভাইস অফলাইন এআই সমর্থন করে না' : 'Device WebGPU Not Supported'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-normal">
                            {lang === 'bn'
                              ? 'বিশ্লেষণের জন্য অনুগ্রহ করে ইন্টারনেটে সংযুক্ত হন।'
                              : 'Please connect to internet for cloud analysis.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isOnline && offlineModelStatus !== 'missing' && offlineModelStatus !== 'unsupported' && (
                    <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/50 px-3.5 py-2 dark:border-amber-800/40 dark:bg-amber-950/20">
                      <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        {lang === 'bn' ? 'অফলাইন মোড সক্রিয় — ফলাফল প্রাথমিক হবে' : 'Offline mode active — preliminary scan'}
                      </span>
                    </div>
                  )}

                  {/* Error State */}
                  {isError && (
                    <Alert variant="destructive" className="rounded-2xl">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>
                        {lang === 'bn' ? 'বিশ্লেষণ সম্পন্ন করা সম্ভব হয়নি' : 'Analysis Incomplete'}
                      </AlertTitle>
                      <AlertDescription>
                        <p className="mb-2.5 text-xs leading-relaxed font-normal">{error}</p>
                        <Button
                          onClick={handleAnalyzeClick}
                          variant="outline"
                          size="sm"
                          className="border-destructive/50 text-destructive hover:bg-destructive/10 cursor-pointer font-medium"
                        >
                          <RotateCcw className="mr-2 h-3.5 w-3.5" />
                          {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Main CTA Trigger */}
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      onClick={handleAnalyzeClick}
                      disabled={!selectedFile || isLoading || (!isOnline && offlineModelStatus === 'missing') || (!isOnline && offlineModelStatus === 'unsupported')}
                      className="w-full rounded-2xl h-12 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 hover:from-sky-600 hover:via-cyan-600 hover:to-emerald-600 text-white font-medium text-sm sm:text-base shadow-md hover:shadow-lg transition-all disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Search className="mr-2 h-4.5 w-4.5" />
                      <span>{lang === 'bn' ? 'এআই বিশ্লেষণ শুরু করুন' : 'Begin AI Screening'}</span>
                    </Button>
                  </motion.div>
                </div>

                {/* Ask Nayan AI — general questions before any screening (stays mounted under the analyzing overlay) */}
                <PageChat
                  agent="nayan"
                  contextId="general"
                  getContext={getChatContext}
                  mode="idle"
                  onAttachImage={handleChatAttach}
                />
              </div>

              {/* Right Column (Guidelines & Conditions Screened) */}
              <div className="lg:col-span-6 xl:col-span-6 space-y-5">
                
                {/* Guidelines Card */}
                <div className="glass-card rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100/80 dark:border-gray-800/80">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {lang === 'bn' ? 'কীভাবে সঠিক ছবি তুলবেন' : 'Image Capture Guidelines'}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {INSTRUCTIONS.map((item) => (
                      <div key={item.step} className="flex items-start gap-3.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white text-xs sm:text-sm font-semibold shadow-xs">
                          {lang === 'bn' ? item.stepBn : item.step}
                        </span>
                        <div className="space-y-0.5">
                          <h4 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100">
                            {lang === 'bn' ? item.titleBn : item.titleEn}
                          </h4>
                          <p className="text-xs sm:text-sm leading-relaxed text-gray-600 dark:text-gray-400 font-normal">
                            {lang === 'bn' ? item.descBn : item.descEn}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl bg-sky-100/70 dark:bg-sky-950/60 p-3.5 border border-sky-300/80 dark:border-sky-800/60 shadow-2xs">
                    <p className="text-xs sm:text-sm leading-relaxed text-sky-900 dark:text-sky-200 font-normal">
                      💡 {lang === 'bn' ? 'টিপস: ক্যামেরার ফ্ল্যাশ সরাসরি চোখে না মেরে স্বাভাবিক দিনের আলো বা উজ্জ্বল ঘরের আলোতে ছবি তুললে সর্বাধিক নির্ভুল ফলাফল পাওয়া যায়।' : 'Tip: Natural indirect room lighting provides significantly higher diagnostic accuracy than harsh flash.'}
                    </p>
                  </div>
                </div>

                {/* Common Conditions Screened Card */}
                <div className="glass-card rounded-3xl p-6 space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100/80 dark:border-gray-800/80">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {lang === 'bn' ? 'যা যা শনাক্তকরণে সাহায্য করে' : 'Screened Eye Conditions'}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {SCREENED_CONDITIONS.map((cond, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium glass-pill text-gray-700 dark:text-gray-200 shadow-xs hover:border-sky-300 transition-colors"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                        <span>{lang === 'bn' ? cond.nameBn : cond.nameEn}</span>
                      </span>
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 pt-1 leading-relaxed font-normal">
                    {lang === 'bn'
                      ? 'নয়ান AI গ্রামীণ ও শহরতলির মানুষের অন্ধত্ব প্রতিরোধে প্রাথমিক স্ক্রিনিং প্রদান করে।'
                      : 'Nayan AI assists rural and urban communities in early detection to prevent preventable blindness.'}
                  </p>
                </div>

              </div>
            </div>
          ) : (
            /* POST-ANALYSIS / RESULT STATE: Consistent Console & Left-Aligned Recommendations */
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                
                {/* Left Column: Biometric Ocular Console + Clinical Recommendations (Like Before) */}
                <div className="lg:col-span-6 xl:col-span-6 space-y-5">
                  
                  {/* Consistent Biometric Ocular Console */}
                  <div className="glass-card rounded-3xl p-5 sm:p-7 space-y-5">
                    <div className="flex items-center justify-between border-b border-gray-100/80 dark:border-gray-800/80 pb-3.5">
                      <div className="flex items-center gap-2">
                        <Scan className="h-4 w-4 text-sky-500" />
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {lang === 'bn' ? 'বায়োমেট্রিক অপটিক্যাল স্ক্যানার' : 'Biometric Ocular Console'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-sky-600 dark:text-sky-400">
                          #SCAN-{result.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-900/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{lang === 'bn' ? 'বিশ্লেষণ সম্পন্ন' : 'Scan Completed'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Viewfinder Frame with authentic corner reticles matching pre-scan console */}
                    <div className="relative rounded-3xl p-5 sm:p-6 bg-sky-50/20 dark:bg-sky-950/15 border border-sky-200/60 dark:border-sky-800/40 flex flex-col items-center justify-center text-center">
                      {/* Biometric Corner Reticles */}
                      <div className="pointer-events-none absolute top-3.5 left-3.5 w-4 h-4 border-t-2 border-l-2 border-sky-500/70 rounded-tl" />
                      <div className="pointer-events-none absolute top-3.5 right-3.5 w-4 h-4 border-t-2 border-r-2 border-sky-500/70 rounded-tr" />
                      <div className="pointer-events-none absolute bottom-3.5 left-3.5 w-4 h-4 border-b-2 border-l-2 border-sky-500/70 rounded-bl" />
                      <div className="pointer-events-none absolute bottom-3.5 right-3.5 w-4 h-4 border-b-2 border-r-2 border-sky-500/70 rounded-br" />

                      <div className="relative w-full max-w-sm h-64 sm:h-72 rounded-2xl overflow-hidden shadow-xl ring-2 ring-sky-400/40 bg-black/5 dark:bg-black/30 group">
                        {selectedPreviewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedPreviewUrl}
                            alt="Analyzed eye"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs font-medium">
                            {lang === 'bn' ? 'ছবি প্রদর্শিত হচ্ছে' : 'Preview Available'}
                          </div>
                        )}

                        {/* Biometric Viewfinder Corner Reticles */}
                        <div className="absolute inset-0 pointer-events-none rounded-2xl border border-sky-400/20">
                          <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-sky-400" />
                          <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-sky-400" />
                          <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-sky-400" />
                          <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-sky-400" />
                        </div>

                        {/* Optical Metadata Tag */}
                        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono font-medium text-sky-300 border border-sky-400/30 flex items-center gap-1.5 shadow-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          <span>{lang === 'bn' ? 'বায়োমেট্রিক অপটিক্যাল স্ক্যান' : 'BIOMETRIC OCULAR SPECTRUM'}</span>
                        </div>

                        {/* Status Badge */}
                        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-white flex items-center gap-1.5 shadow-sm border border-white/10">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          <span>{lang === 'bn' ? 'বিশ্লেষণ সম্পন্ন' : 'Scan Completed'}</span>
                        </div>
                      </div>

                      <p className="mt-3.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {lang === 'bn'
                          ? 'বায়োমেট্রিক দৃষ্টি বিশ্লেষণ সফলভাবে সম্পন্ন হয়েছে'
                          : 'Ocular biometric scan completed successfully'}
                      </p>
                    </div>

                    <Button
                      onClick={handleReset}
                      className="w-full rounded-2xl h-12 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm sm:text-base shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      <span>{lang === 'bn' ? 'অন্য একটি ছবি স্ক্যান করুন' : 'Scan Another Photo'}</span>
                    </Button>
                  </div>

                  {/* Clinical Guidance & Recommendations (Positioned on Left Side) */}
                  <EyeResultCard
                    result={result}
                    lang={lang}
                    analysisMode={analysisMode}
                    isUpgrading={isUpgrading}
                    variant="advice"
                  />

                  {/* Ask Nayan AI about this screening */}
                  <PageChat
                    agent="nayan"
                    contextId={result.id}
                    getContext={getChatContext}
                    mode="result"
                    contextLabel={chatContextLabel}
                    onAttachImage={handleChatAttach}
                  />
                </div>

                {/* Right Column: Primary Clinical Diagnosis Card + About Condition */}
                <div className="lg:col-span-6 xl:col-span-6 space-y-5">
                  {/* Primary Clinical Report Card (Summary: Diagnosis, Severity, Confidence, Urgency, PDF, Share) */}
                  <EyeResultCard
                    result={result}
                    lang={lang}
                    analysisMode={analysisMode}
                    isUpgrading={isUpgrading}
                    variant="summary"
                  />

                  {/* About This Condition Panel */}
                  {(result.disease_description_en || result.disease_description_bn) && (
                    <ResultCard
                      title={lang === 'bn' ? 'এই অবস্থা সম্পর্কে তথ্যাবলী' : 'About This Condition'}
                      icon={<BookOpen className="h-4 w-4 text-sky-500" />}
                      badge={
                        result.disease_stage
                          ? {
                              label: result.disease_stage === 'Advanced'
                                ? (lang === 'bn' ? 'উন্নত পর্যায়' : 'Advanced')
                                : result.disease_stage === 'Moderate'
                                  ? (lang === 'bn' ? 'মাঝারি পর্যায়' : 'Moderate')
                                  : result.disease_stage === 'Early'
                                    ? (lang === 'bn' ? 'প্রাথমিক পর্যায়' : 'Early')
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
                        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-normal">
                          {lang === 'bn'
                            ? result.disease_description_bn
                            : result.disease_description_en}
                        </p>
                        {result.disease_stage === 'Advanced' && (
                          <div className="rounded-2xl border border-red-200 bg-red-50/80 p-3.5 dark:border-red-800 dark:bg-red-950/40">
                            <p className="text-xs sm:text-sm font-semibold text-red-700 dark:text-red-300">
                              ⚠️ {lang === 'bn'
                                ? 'উন্নত পর্যায় সনাক্ত — অবিলম্বে একজন চক্ষুরোগ বিশেষজ্ঞের কাছে যান।'
                                : 'Advanced stage detected — seek immediate consultation with an ophthalmologist.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </ResultCard>
                  )}

                  {/* Doctor Recommendation Card (Directly After About This Condition) */}
                  <TopDoctorsCard doctors={doctors} isLoading={doctorsLoading} layout="column" />
                </div>
              </div>
            </div>
          )}

          {/* Past History (When no current result is displayed) */}
          {!result && (
            <div className="pt-4">
              <PastAnalyses
                history={history}
                isLoading={historyLoading}
                lang={lang}
                onSelect={handleSelectHistory}
              />
            </div>
          )}

          {/* Elevated Clinical Regulatory Advisory & Footer Card */}
          <div className="pt-4 max-w-5xl mx-auto">
            <div className="glass-card rounded-3xl p-5 sm:p-6 border border-amber-200/70 dark:border-amber-900/50 bg-gradient-to-r from-amber-50/40 via-white/70 to-sky-50/40 dark:from-amber-950/20 dark:via-gray-900/70 dark:to-sky-950/20 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap border-b border-amber-200/40 dark:border-amber-900/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {lang === 'bn' ? 'ক্লিনিক্যাল নির্দেশিকা ও আইনগত সতর্কবার্তা' : 'Clinical Regulatory & Safety Advisory'}
                  </h4>
                </div>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-300/50 dark:border-amber-800/50">
                  {lang === 'bn' ? 'প্রাথমিক ট্রায়াজ প্রযুক্তি' : 'AI Triage Engine v3.5'}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-normal">
                {lang === 'bn'
                  ? 'ShasthyaHub-AI একটি কৃত্রিম বুদ্ধিমত্তা নির্ভর প্রাথমিক স্ক্রিনিং ব্যবস্থা, কোনো নিবন্ধিত চিকিৎসকের বিকল্প বা চূড়ান্ত ক্লিনিকাল ডায়াগনোসিস নয়। দৃষ্টিশক্তি সুরক্ষার স্বার্থে যেকোনো ঔষধ গ্রহণ বা চিকিৎসা শুরুর পূর্বে সর্বদা একজন বাংলাদেশ মেডিকেল অ্যান্ড ডেন্টাল কাউন্সিল (BMDC) নিবন্ধিত চক্ষু বিশেষজ্ঞের (Ophthalmologist) সাথে সরাসরি পরামর্শ করুন।'
                  : 'ShasthyaHub-AI is an automated clinical AI screening and triage tool, not a certified clinical diagnosis or replacement for a licensed doctor. Always consult a BMDC-registered ophthalmologist before initiating any treatment or medication.'}
              </p>

              <div className="flex items-center justify-between gap-3 pt-1 flex-wrap text-xs text-gray-500 dark:text-gray-400">
                <span>{lang === 'bn' ? 'জরুরি প্রয়োজনে সরকারি স্বাস্থ্য বাতায়নে যোগাযোগ করুন:' : 'For emergency assistance, contact national helplines:'}</span>
                <div className="flex items-center gap-2">
                  <a
                    href="tel:16263"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:text-rose-600 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Phone className="h-3 w-3 text-rose-500" />
                    <span>১৬২৬৩ (স্বাস্থ্য বাতায়ন)</span>
                  </a>
                  <a
                    href="tel:999"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:text-rose-600 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Phone className="h-3 w-3 text-rose-500" />
                    <span>৯৯৯ (জরুরি সেবা)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
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
  onSelect?: (item: ReturnType<typeof useNayanHistory>['history'][number]) => void
}

function PastAnalyses({ history, isLoading, lang, onSelect }: PastAnalysesProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-2xl glass-card"
          />
        ))}
      </div>
    )
  }

  if (history.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {lang === 'bn' ? 'পূর্ববর্তী স্ক্রিনিং ইতিহাস' : 'Recent Eye Screenings'}
          </h3>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {lang === 'bn' ? 'ফলাফল দেখতে কার্ডে ক্লিক করুন' : 'Click card to view details'}
        </span>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {history.map((item) => {
          const style =
            item.severity && item.severity in severityStyles
              ? severityStyles[item.severity]
              : null
          const localized = item.diagnosis ? localizeDiagnosis(item.diagnosis, lang) : null

          return (
            <li
              key={item.id}
              onClick={() => onSelect?.(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect?.(item)
                }
              }}
              className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3 hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer group active:scale-[0.99] focus:outline-hidden focus:ring-2 focus:ring-sky-400"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {localized?.title ?? (lang === 'bn' ? 'অজানা ফলাফল' : 'Unknown')}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  {formatDate(item.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {style && item.severity && (
                  <Badge variant={style.badge}>
                    {severityLabel(item.severity, lang)}
                  </Badge>
                )}
                {item.confidence_score !== null && (
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                    {lang === 'bn'
                      ? `${toBengaliDigits(Math.round(item.confidence_score))}%`
                      : `${Math.round(item.confidence_score)}%`}
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
