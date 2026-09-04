'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle,
  Cpu,
  Download,
  Eye,
  History,
  Lightbulb,
  RotateCcw,
  Scan,
  Search,
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
import { formatDate, toBengaliDigits } from '@/lib/utils'

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
        <div className="relative mx-auto max-w-6xl space-y-7 p-4 sm:p-6 lg:p-8">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
            <div className="flex items-start gap-3.5">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 via-cyan-500 to-emerald-500 text-white shadow-lg shadow-sky-500/20">
                <Eye className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                    {lang === 'bn' ? 'নয়ন AI — চোখের স্ক্রিনিং' : 'Nayan AI — Eye Screening'}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-sky-100/80 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300/50 dark:border-sky-800/40 shadow-xs">
                    <Sparkles className="h-3 w-3 text-sky-500" />
                    <span>{lang === 'bn' ? 'বায়োমেট্রিক দৃষ্টি বিশ্লেষণ' : 'Vision Intelligence'}</span>
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 max-w-2xl">
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
                className="self-start sm:self-center rounded-xl glass-pill hover:bg-sky-50 dark:hover:bg-sky-950/50 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-bold"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                <span>{lang === 'bn' ? 'নতুন ছবি আপলোড' : 'Upload New'}</span>
              </Button>
            )}
          </div>

          {/* MAIN WORKSPACE GRID */}
          {!result ? (
            /* PRE-ANALYSIS / UPLOAD STATE: Balanced 2-Column Console */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              
              {/* Left Column (Upload & Scanner Frame) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="glass-card rounded-3xl p-5 sm:p-7 space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-100/80 dark:border-gray-800/80 pb-3.5">
                    <div className="flex items-center gap-2">
                      <Scan className="h-4 w-4 text-sky-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        {lang === 'bn' ? 'বায়োমেট্রিক অপটিক্যাল স্ক্যানার' : 'Biometric Ocular Console'}
                      </span>
                    </div>
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-900/40">
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
                  />

                  {/* Offline Warning Banners */}
                  {!isOnline && offlineModelStatus === 'missing' && (
                    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 dark:border-amber-800/50 dark:bg-amber-950/30">
                      <div className="flex items-start gap-3">
                        <Download className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                            {lang === 'bn' ? 'অফলাইন মডেল উপলব্ধ নয়' : 'Offline Model Not Cached'}
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
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
                          <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                            {lang === 'bn' ? 'ডিভাইস অফলাইন এআই সমর্থন করে না' : 'Device WebGPU Not Supported'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
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
                        <p className="mb-2.5 text-xs leading-relaxed">{error}</p>
                        <Button
                          onClick={handleAnalyzeClick}
                          variant="outline"
                          size="sm"
                          className="border-destructive/50 text-destructive hover:bg-destructive/10"
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
                      className="w-full rounded-2xl h-14 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 hover:from-sky-600 hover:via-cyan-600 hover:to-emerald-600 text-white font-black text-base shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/35 transition-all disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Search className="mr-2 h-5 w-5" />
                      <span>{lang === 'bn' ? 'এআই বিশ্লেষণ শুরু করুন' : 'Begin AI Screening'}</span>
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Right Column (Guidelines & Conditions Screened) */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* Guidelines Card */}
                <div className="glass-card rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100/80 dark:border-gray-800/80">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {lang === 'bn' ? 'কীভাবে সঠিক ছবি তুলবেন' : 'Image Capture Guidelines'}
                    </h3>
                  </div>

                  <div className="space-y-3.5">
                    {INSTRUCTIONS.map((item) => (
                      <div key={item.step} className="flex items-start gap-3.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white text-xs font-black shadow-xs">
                          {lang === 'bn' ? item.stepBn : item.step}
                        </span>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                            {lang === 'bn' ? item.titleBn : item.titleEn}
                          </h4>
                          <p className="text-[12px] leading-relaxed text-gray-500 dark:text-gray-400">
                            {lang === 'bn' ? item.descBn : item.descEn}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-sky-50/60 dark:bg-sky-950/30 p-3 border border-sky-200/50 dark:border-sky-800/40">
                    <p className="text-[11px] leading-relaxed text-sky-800 dark:text-sky-300 font-medium">
                      💡 {lang === 'bn' ? 'টিপস: ক্যামেরার ফ্ল্যাশ সরাসরি চোখে না মেরে স্বাভাবিক দিনের আলো বা উজ্জ্বল ঘরের আলোতে ছবি তুললে সর্বাধিক নির্ভুল ফলাফল পাওয়া যায়।' : 'Tip: Natural indirect room lighting provides significantly higher diagnostic accuracy than harsh flash.'}
                    </p>
                  </div>
                </div>

                {/* Common Conditions Screened Card */}
                <div className="glass-card rounded-3xl p-6 space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100/80 dark:border-gray-800/80">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {lang === 'bn' ? 'যা যা শনাক্তকরণে সাহায্য করে' : 'Screened Eye Conditions'}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {SCREENED_CONDITIONS.map((cond, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold glass-pill text-gray-700 dark:text-gray-200 shadow-xs hover:border-sky-300 transition-colors"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                        <span>{lang === 'bn' ? cond.nameBn : cond.nameEn}</span>
                      </span>
                    ))}
                  </div>

                  <p className="text-[11px] text-gray-400 dark:text-gray-500 pt-1 leading-relaxed">
                    {lang === 'bn'
                      ? 'নয়ান AI গ্রামীণ ও শহরতলির মানুষের অন্ধত্ব প্রতিরোধে প্রাথমিক স্ক্রিনিং প্রদান করে।'
                      : 'Nayan AI assists rural and urban communities in early detection to prevent preventable blindness.'}
                  </p>
                </div>

              </div>
            </div>
          ) : (
            /* POST-ANALYSIS / RESULT STATE: Balanced Diagnostic Console */
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                
                {/* Left Column: Eye Image + Primary Clinical Report Card */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Scanned Image Preview with Authentic Biometric Reticles */}
                  <div className="glass-card rounded-3xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100/80 dark:border-gray-800/80 pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                        {lang === 'bn' ? 'স্ক্যানকৃত চোখের চিত্র' : 'Analyzed Ocular Capture'}
                      </span>
                      <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                        #SCAN-{result.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>

                    <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden shadow-md bg-black/5 dark:bg-black/30 border border-sky-200/50 dark:border-sky-800/50">
                      {selectedPreviewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedPreviewUrl}
                          alt="Analyzed eye"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs">
                          {lang === 'bn' ? 'ছবি প্রদর্শিত হচ্ছে' : 'Preview Available'}
                        </div>
                      )}

                      {/* Biometric Viewfinder Corner Reticles (No misplaced static circles!) */}
                      <div className="absolute inset-0 pointer-events-none rounded-2xl">
                        <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-sky-400" />
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-sky-400" />
                        <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-sky-400" />
                        <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-sky-400" />
                      </div>

                      {/* Optical Metadata Tag */}
                      <div className="absolute top-3 left-3 bg-black/65 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold text-sky-300 border border-sky-400/30 flex items-center gap-1.5 shadow-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span>{lang === 'bn' ? 'বায়োমেট্রিক অপটিক্যাল স্ক্যান' : 'BIOMETRIC OCULAR SPECTRUM'}</span>
                      </div>

                      {/* Status Badge */}
                      <div className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-white flex items-center gap-1.5 shadow-sm border border-white/10">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span>{lang === 'bn' ? 'বিশ্লেষণ সম্পন্ন' : 'Scan Completed'}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleReset}
                      className="w-full rounded-2xl h-11 bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      <span>{lang === 'bn' ? 'অন্য একটি ছবি স্ক্যান করুন' : 'Scan Another Photo'}</span>
                    </Button>
                  </div>

                  {/* Primary Clinical Report Card (Summary: Diagnosis, Severity, Confidence, Urgency, PDF, Share) */}
                  <EyeResultCard
                    result={result}
                    lang={lang}
                    analysisMode={analysisMode}
                    isUpgrading={isUpgrading}
                    variant="summary"
                  />
                </div>

                {/* Right Column: About Condition + Clinical Recommendations + Top Doctors */}
                <div className="lg:col-span-7 space-y-5">
                  {/* About This Condition Panel */}
                  {(result.disease_description_en || result.disease_description_bn) && (
                    <ResultCard
                      title={lang === 'bn' ? 'এই অবস্থা সম্পর্কে তথ্যাবলী' : 'About This Condition'}
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
                        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-medium">
                          {lang === 'bn'
                            ? result.disease_description_bn
                            : result.disease_description_en}
                        </p>
                        {result.disease_stage === 'Advanced' && (
                          <div className="rounded-2xl border border-red-200 bg-red-50/80 p-3.5 dark:border-red-800 dark:bg-red-950/40">
                            <p className="text-xs font-bold text-red-700 dark:text-red-300">
                              ⚠️ {lang === 'bn'
                                ? 'উন্নত পর্যায় সনাক্ত — অবিলম্বে একজন চক্ষুরোগ বিশেষজ্ঞের কাছে যান।'
                                : 'Advanced stage detected — seek immediate consultation with an ophthalmologist.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </ResultCard>
                  )}

                  {/* Clinical Guidance & Recommended Action Items */}
                  <EyeResultCard
                    result={result}
                    lang={lang}
                    analysisMode={analysisMode}
                    isUpgrading={isUpgrading}
                    variant="advice"
                  />

                  {/* Recommended Specialists & Eye Centers (Positioned Right Here - Visible Above the Fold!) */}
                  <TopDoctorsCard doctors={doctors} isLoading={doctorsLoading} />
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
              />
            </div>
          )}

          {/* Clinical Disclaimer Footnote */}
          <div className="pt-6 border-t border-gray-100/80 dark:border-gray-800/80 text-center max-w-3xl mx-auto">
            <p className="text-[12px] leading-relaxed text-gray-400 dark:text-gray-500 font-medium">
              {lang === 'bn'
                ? 'আইনি সতর্কবার্তা: ShasthyaHub-AI একটি কৃত্রিম বুদ্ধিমত্তা নির্ভর প্রাথমিক স্ক্রিনিং ব্যবস্থা, ক্লিনিকাল চূড়ান্ত রোগ নির্ণয় নয়। দৃষ্টিশক্তি সুরক্ষার স্বার্থে যেকোনো ঔষধ বা চিকিৎসার পূর্বে সর্বদা একজন যোগ্য চক্ষু বিশেষজ্ঞের পরামর্শ নিন।'
                : 'CLINICAL DISCLAIMER: ShasthyaHub-AI is an automated AI triage and screening tool, not a certified clinical diagnosis. Always consult a licensed medical ophthalmologist before making health decisions.'}
            </p>
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
}

function PastAnalyses({ history, isLoading, lang }: PastAnalysesProps) {
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
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
          {lang === 'bn' ? 'পূর্ববর্তী স্ক্রিনিং ইতিহাস' : 'Recent Eye Screenings'}
        </h3>
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
              className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3 hover:shadow-md transition-all"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
                  {localized?.title ?? (lang === 'bn' ? 'অজানা ফলাফল' : 'Unknown')}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
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
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-800 px-2 py-0.5 rounded-md">
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
