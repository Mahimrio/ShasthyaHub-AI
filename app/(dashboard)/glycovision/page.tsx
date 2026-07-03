'use client'

import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Apple,
  BarChart3,
  Clock,
  Heart,
  History,
  Info,
  Play,
  RotateCcw,
  Salad,
  Sparkles,
  Upload,
  Utensils,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { DisclaimerModal } from '@/components/shared/DisclaimerModal'
import { AnalyzingAnimation } from '@/components/shared/AnalyzingAnimation'
import { ResultCard } from '@/components/shared/ResultCard'
import FoodItemsList from '@/components/features/glycovision/FoodItemsList'
import NutritionDonutChart from '@/components/features/glycovision/NutritionDonutChart'
import RiskScoreCard from '@/components/features/glycovision/RiskScoreCard'
import { useGlycoVisionHistory } from '@/hooks/useGlycoVisionHistory'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate } from '@/lib/utils'
import type { EnrichedFoodItem, ChronicDiseaseRisk, RiskLevel, MealModification } from '@/types'

type AnalysisState = 'idle' | 'disclaimer' | 'uploading' | 'processing' | 'complete'

type MainTab = 'upload' | 'history'
type ResultTab = 'overview' | 'nutrients' | 'risks' | 'suggestions'

interface AnalysisResult {
  items: EnrichedFoodItem[]
  totalCalories: number
  totalCarbs: number
  totalProtein: number
  totalFat: number
  glycemicLoad: number
  riskLevel: RiskLevel
  riskSummaryEn: string
  riskSummaryBn: string
  chronicDiseaseRisks: ChronicDiseaseRisk[]
  mealModifications: MealModification[]
}

const DISEASE_EMOJI_MAP: Record<string, string> = {
  'Type 2 Diabetes': '🩸',
  'Hypertension (High Blood Pressure)': '💓',
  'Heart Disease': '❤️‍🩹',
}

const DISEASE_STATUS_CONFIG = {
  Danger: {
    labelEn: 'High Risk', labelBn: 'উচ্চ ঝুঁকি',
    border: 'border-red-200 dark:border-red-800', bg: 'bg-red-50 dark:bg-red-950/40',
    accent: 'bg-red-500', badgeBg: 'bg-red-100 dark:bg-red-900/60', badgeText: 'text-red-700 dark:text-red-300',
    text: 'text-red-700 dark:text-red-300', icon: Heart,
  },
  Caution: {
    labelEn: 'Moderate Risk', labelBn: 'মাঝারি ঝুঁকি',
    border: 'border-amber-200 dark:border-amber-800', bg: 'bg-amber-50 dark:bg-amber-950/40',
    accent: 'bg-amber-500', badgeBg: 'bg-amber-100 dark:bg-amber-900/60', badgeText: 'text-amber-700 dark:text-amber-300',
    text: 'text-amber-700 dark:text-amber-300', icon: Heart,
  },
  Safe: {
    labelEn: 'Safe', labelBn: 'নিরাপদ',
    border: 'border-green-200 dark:border-green-800', bg: 'bg-green-50 dark:bg-green-950/40',
    accent: 'bg-green-500', badgeBg: 'bg-green-100 dark:bg-green-900/60', badgeText: 'text-green-700 dark:text-green-300',
    text: 'text-green-700 dark:text-green-300', icon: Heart,
  },
}

export default function GlycoVisionPage() {
  const { lang } = useLanguage()
  const [mainTab, setMainTab] = useState<MainTab>('upload')
  const [resultTab, setResultTab] = useState<ResultTab>('overview')
  const [state, setState] = useState<AnalysisState>('disclaimer')
  const [showDisclaimer, setShowDisclaimer] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const { history: pastFoodHistory, isLoading: historyLoading } = useGlycoVisionHistory()

  const resultKeyRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const handleAcceptDisclaimer = useCallback(() => {
    setShowDisclaimer(false)
    setState('idle')
  }, [])

  const handleImageSelect = async (file: File) => {
    abortRef.current?.abort()
    const key = ++resultKeyRef.current
    setResult(null)
    setErrorMsg('')
    setState('processing')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/glycovision/analyze', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      if (key !== resultKeyRef.current) return

      const body = await res.json()
      if (!body.success) {
        setErrorMsg(body.error_bn ?? body.error ?? 'Analysis failed')
        setState('complete')
        return
      }

      const d = body.data
      setResult({
        items: (d.identified_items ?? []).map((i: Record<string, unknown>) => ({
          name_en: i.name_en as string,
          name_bn: (i.name_bn as string) ?? '',
          estimated_grams: i.estimated_grams as number,
          calories: i.calories as number,
          carbs_g: i.carbs_g as number,
          protein_g: i.protein_g as number,
          fat_g: i.fat_g as number,
          confidence: typeof i.confidence === 'number' ? i.confidence : (i.confidence as number) / 100,
        })),
        totalCalories: d.total_calories ?? 0,
        totalCarbs: d.total_carbs_g ?? 0,
        totalProtein: d.total_protein_g ?? 0,
        totalFat: d.total_fat_g ?? 0,
        glycemicLoad: d.glycemic_load ?? 0,
        riskLevel: d.risk_level ?? 'Green',
        riskSummaryEn: d.risk_summary_en ?? '',
        riskSummaryBn: d.risk_summary_bn ?? '',
        chronicDiseaseRisks: d.chronic_disease_risks ?? [],
        mealModifications: (d.meal_modifications ?? []).map((m: Record<string, unknown>) => ({
          suggestion_en: (m.suggestion_en as string) ?? '',
          suggestion_bn: (m.suggestion_bn as string) ?? '',
          impact: (m.impact as MealModification['impact']) ?? 'positive',
          nutrient: (m.nutrient as string) ?? '',
          current_value: Number(m.current_value ?? 0),
          suggested_value: Number(m.suggested_value ?? 0),
          calories_saved: Number(m.calories_saved ?? 0),
        })),
      })
      setState('complete')
      setResultTab('overview')
    } catch {
      if (key !== resultKeyRef.current) return
      setErrorMsg(lang === 'bn' ? 'বিশ্লেষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' : 'Analysis failed. Please try again.')
      setState('complete')
    }
  }

  const handleReset = () => {
    abortRef.current?.abort()
    ++resultKeyRef.current
    setResult(null)
    setErrorMsg('')
    setState('idle')
  }

  const resultTabs: { key: ResultTab; labelEn: string; labelBn: string; icon: typeof BarChart3 }[] = [
    { key: 'overview', labelEn: 'Overview', labelBn: 'সারসংক্ষেপ', icon: BarChart3 },
    { key: 'nutrients', labelEn: 'Nutrients', labelBn: 'পুষ্টি', icon: Apple },
    { key: 'risks', labelEn: 'Risks', labelBn: 'ঝুঁকি', icon: Heart },
    { key: 'suggestions', labelEn: 'Suggestions', labelBn: 'পরামর্শ', icon: Salad },
  ]

  const glycoStages = [
    { en: '📡 Sending meal photo to Vision Engine...', bn: '📡 খাবারের ছবি ভিশন ইঞ্জিনে পাঠানো হচ্ছে...' },
    { en: '🍽️ Identifying food items...', bn: '🍽️ খাদ্য উপাদান চিহ্নিত করা হচ্ছে...' },
    { en: '🔬 Calculating nutrition values...', bn: '🔬 পুষ্টির মান গণনা করা হচ্ছে...' },
    { en: '📊 Analyzing health risks...', bn: '📊 স্বাস্থ্য ঝুঁকি বিশ্লেষণ করা হচ্ছে...' },
    { en: '✅ Almost done...', bn: '✅ প্রায় শেষ...' },
  ]

  return (
    <>
      <DisclaimerModal
        open={showDisclaimer}
        onOpenChange={setShowDisclaimer}
        onAccept={handleAcceptDisclaimer}
      />

      {state === 'processing' && (
        <AnalyzingAnimation
          stages={glycoStages}
          icon={
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
              <Utensils className="h-10 w-10 text-white" />
            </div>
          }
        />
      )}

      {/* Dynamic Animated Fixed Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-gray-50 via-amber-50/30 to-orange-50/20 dark:from-gray-950 dark:via-amber-950/30 dark:to-orange-950/20 animate-gradient-bg z-0 motion-reduce:animate-none motion-reduce:bg-gray-50 motion-reduce:dark:bg-gray-950">
        {/* Ambient Radial Gradient Blobs */}
        <div className="absolute -left-32 top-10 h-[700px] w-[700px] rounded-full bg-amber-300/40 dark:bg-amber-500/20 blur-[140px] motion-reduce:hidden animate-float-1" />
        <div className="absolute -right-32 top-40 h-[700px] w-[700px] rounded-full bg-orange-300/35 dark:bg-orange-500/20 blur-[140px] motion-reduce:hidden animate-float-2" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[500px] w-[800px] rounded-full bg-yellow-200/25 dark:bg-yellow-600/15 blur-[160px] motion-reduce:hidden animate-float-3" />
      </div>

      <div className="relative min-h-screen z-10">
        <div className="relative z-10 mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
            <Utensils className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 md:text-2xl">
              {lang === 'bn' ? 'গ্লাইকোভিশন — খাদ্য বিশ্লেষণ' : 'GlycoVision — Food Analysis'}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {lang === 'bn'
                ? 'আপনার খাবারের ছবি আপলোড করুন। AI ক্যালোরি, কার্বোহাইড্রেট, প্রোটিন ও ফ্যাট গণনা করবে এবং গ্লাইসেমিক লোড নির্ণয় করবে।'
                : 'Upload a photo of your meal to get calorie, carb, protein, and fat breakdown plus glycemic load assessment.'}
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          {[
            { key: 'upload' as const, icon: Upload, labelEn: 'Upload Meal', labelBn: 'খাবারের ছবি' },
            { key: 'history' as const, icon: History, labelEn: 'History', labelBn: 'ইতিহাস' },
          ].map((tab) => {
            const Icon = tab.icon
            const active = mainTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setMainTab(tab.key)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                )}
              >
                <Icon className="h-4 w-4" />
                {lang === 'bn' ? tab.labelBn : tab.labelEn}
              </button>
            )
          })}
        </div>

        {/* Upload tab */}
        {mainTab === 'upload' && (
          <>
            {/* Idle state -- uploader + demo quick actions */}
            <AnimatePresence mode="wait">
              {state !== 'complete' && (
                <motion.div
                  key="upload-section"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="space-y-4"
                >
                  {/* Image uploader (visible before processing starts) */}
                  {state !== 'processing' && (
                    <>
                      <ImageUploader
                        onImageSelect={handleImageSelect}
                        acceptedTypes="image/*"
                        maxSizeMB={10}
                      />
                      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                        {lang === 'bn'
                          ? 'পুরো খাবারের ছবি তুলুন — একক উপাদান নয়'
                          : 'Capture your full plate — not individual items'}
                      </p>

                      {/* Demo quick-action buttons */}
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          onClick={() => window.open('/demo/glycovision', '_blank')}
                          variant="outline"
                          className="flex-1 rounded-xl"
                        >
                          <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                          {lang === 'bn' ? 'ডেমো দেখুন' : 'View Demo'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-400"
                          onClick={() => {
                            if (lang === 'bn') {
                              setErrorMsg('শীঘ্রই আসছে! আপনি এখন ডেমো পেজ দেখতে পারেন।')
                            } else {
                              setErrorMsg('Coming soon! You can try the demo page for now.')
                            }
                          }}
                        >
                          <Play className="mr-1 h-3 w-3" />
                          {lang === 'bn' ? 'দ্রুত ডেমো' : 'Quick Demo'}
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Processing state is handled by full-screen AnalyzingAnimation above */}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            {state === 'complete' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Error display */}
                {errorMsg && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">{errorMsg}</p>
                  </div>
                )}

                {result && !errorMsg && (
                  <>
                    {/* Result tabs */}
                    <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                      {resultTabs.map((tab) => {
                        const Icon = tab.icon
                        const active = resultTab === tab.key
                        return (
                          <button
                            key={tab.key}
                            onClick={() => setResultTab(tab.key)}
                            className={cn(
                              'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                              active
                                ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {lang === 'bn' ? tab.labelBn : tab.labelEn}
                          </button>
                        )
                      })}
                    </div>

                    {/* Tab content */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={resultTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Overview tab */}
                        {resultTab === 'overview' && (
                          <div className="space-y-4">
                            <RiskScoreCard
                              riskLevel={result.riskLevel}
                              glycemicLoad={result.glycemicLoad}
                              summaryEn={result.riskSummaryEn}
                              summaryBn={result.riskSummaryBn}
                              lang={lang}
                            />
                            <ResultCard
                              title={lang === 'bn' ? 'খাদ্য তালিকা' : 'Food Items'}
                              badge={{
                                label: `${result.items.length} ${lang === 'bn' ? 'টি' : 'items'}`,
                                variant: 'default',
                              }}
                            >
                              <div className="pt-3">
                                <FoodItemsList items={result.items} lang={lang} />
                              </div>
                            </ResultCard>
                          </div>
                        )}

                        {/* Nutrients tab */}
                        {resultTab === 'nutrients' && (
                          <ResultCard
                            title={lang === 'bn' ? 'পুষ্টি বিশ্লেষণ' : 'Nutrient Analysis'}
                          >
                            <div className="pt-3">
                              <NutritionDonutChart
                                carbsG={result.totalCarbs}
                                proteinG={result.totalProtein}
                                fatG={result.totalFat}
                              />
                            </div>
                          </ResultCard>
                        )}

                        {/* Risks tab */}
                        {resultTab === 'risks' && (
                          <ResultCard
                            title={lang === 'bn' ? 'দীর্ঘমেয়াদী স্বাস্থ্য ঝুঁকি' : 'Chronic Disease Risks'}
                          >
                            <div className="space-y-3 pt-3">
                              {result.chronicDiseaseRisks.length === 0 && (
                                <p className="text-sm text-gray-400 dark:text-gray-500">
                                  {lang === 'bn' ? 'কোনো ঝুঁকি শনাক্ত করা যায়নি।' : 'No risks detected.'}
                                </p>
                              )}
                              {result.chronicDiseaseRisks.map((disease) => {
                                const cfg = DISEASE_STATUS_CONFIG[disease.status]
                                const StatusIcon = cfg.icon
                                const emoji = DISEASE_EMOJI_MAP[disease.disease_en] ?? '⚕️'
                                return (
                                  <div
                                    key={disease.disease_en}
                                    className={cn('rounded-xl border p-4', cfg.bg, cfg.border)}
                                  >
                                    <div className="mb-2.5 flex items-start justify-between">
                                      <div className="flex min-w-0 items-center gap-2">
                                        <span className="shrink-0 text-lg">{emoji}</span>
                                        <span className="text-xs font-semibold leading-tight text-gray-700 dark:text-gray-300">
                                          {disease.disease_bn}
                                        </span>
                                      </div>
                                    </div>
                                    <div className={cn(
                                      'mb-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                                      cfg.badgeBg, cfg.badgeText,
                                    )}>
                                      <StatusIcon className="h-3 w-3" />
                                      {cfg.labelBn}
                                    </div>
                                    <p className="text-[12.5px] leading-relaxed text-gray-600 dark:text-gray-400">
                                      {disease.reason_bn}
                                    </p>
                                  </div>
                                )
                              })}
                            </div>
                          </ResultCard>
                        )}

                        {/* Suggestions tab */}
                        {resultTab === 'suggestions' && (
                          <ResultCard
                            title={lang === 'bn' ? 'পরামর্শ ও পরিবর্তন' : 'Suggestions & Modifications'}
                          >
                            <div className="space-y-3 pt-3">
                              {result.mealModifications.length === 0 && result.glycemicLoad <= 30 && (
                                <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-900/20">
                                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                    {lang === 'bn' ? '✅ এই খাবারটি সুষম এবং নিরাপদ।' : '✅ This meal is balanced and safe.'}
                                  </p>
                                </div>
                              )}
                              {result.mealModifications.map((mod, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    'rounded-xl border-l-4 p-4',
                                    mod.impact === 'positive' || mod.impact === 'High'
                                      ? 'border-l-green-500 bg-green-50 dark:bg-green-950/30'
                                      : 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/30'
                                  )}
                                >
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {lang === 'bn' ? mod.suggestion_bn : mod.suggestion_en}
                                  </p>
                                  {mod.nutrient && mod.current_value > 0 && (
                                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                      <span className="font-semibold uppercase">{mod.nutrient}</span>
                                      <span className="line-through">{mod.current_value}{mod.nutrient === 'Calories' ? 'kcal' : 'g'}</span>
                                      <span className="text-green-600 dark:text-green-400">→ {mod.suggested_value}{mod.nutrient === 'Calories' ? 'kcal' : 'g'}</span>
                                      {(mod.calories_saved ?? 0) > 0 && (
                                        <span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                          {lang === 'bn' ? `${mod.calories_saved} kcal সাশ্রয়` : `Save ${mod.calories_saved} kcal`}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {/* Static tips when glycemic load is high */}
                              {result.glycemicLoad > 40 && (
                                <div className="border-l-4 border-green-500 py-1.5 pl-3">
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {lang === 'bn' ? '💡 ভাতের পরিমাণ কমান' : '💡 Reduce rice portion'}
                                  </p>
                                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                    {lang === 'bn'
                                      ? 'পরবর্তী খাবারে ভাতের পরিবর্তে ১টি রুটি বা সালাদ যোগ করুন'
                                      : 'Try replacing half the rice with a salad or one roti'}
                                  </p>
                                </div>
                              )}
                              {result.totalFat > 20 && (
                                <div className="border-l-4 border-green-500 py-1.5 pl-3">
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {lang === 'bn' ? '💡 কম তেলে রান্না করুন' : '💡 Reduce cooking oil'}
                                  </p>
                                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                    {lang === 'bn'
                                      ? 'তেলের পরিমাণ কমিয়ে বা গ্রিল/স্টিম করে রান্না করতে পারেন'
                                      : 'Consider grilling or steaming instead of frying'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </ResultCard>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {/* Re-upload button */}
                    <Button
                      onClick={handleReset}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-[length:200%_100%] animate-gradient-x text-white font-semibold shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {lang === 'bn' ? 'নতুন খাবারের ছবি আপলোড করুন' : 'Analyze Another Meal'}
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </>
        )}

        {/* History tab */}
        {mainTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {historyLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                  />
                ))}
              </div>
            ) : pastFoodHistory.length === 0 && !result ? (
              <div className="rounded-2xl border border-gray-200/50 bg-white/90 backdrop-blur-sm p-8 text-center dark:border-gray-700/60 dark:bg-gray-900/90 dark:backdrop-blur-sm shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
                <Clock className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {lang === 'bn' ? 'খাদ্য বিশ্লেষণের ইতিহাস' : 'Meal Analysis History'}
                </h3>
                <p className="mx-auto mt-1 max-w-xs text-xs text-gray-400 dark:text-gray-500">
                  {lang === 'bn'
                    ? 'এখনো কোনো বিশ্লেষণ করা হয়নি। আপনার প্রথম খাবারের ছবি আপলোড করুন!'
                    : 'No analysis done yet. Upload your first meal photo to get started!'}
                </p>
              </div>
            ) : (
              <>
                {pastFoodHistory.length > 0 && (
                  <>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Info className="h-4 w-4 text-gray-400" />
                      {lang === 'bn' ? 'পূর্বের বিশ্লেষণ' : 'Past Analyses'}
                    </h3>
                    <ul className="space-y-2">
                      {pastFoodHistory.map((item) => {
                        const riskBadge = item.risk_level === 'Red'
                          ? 'destructive'
                          : item.risk_level === 'Yellow'
                            ? 'secondary'
                            : 'outline'
                        const riskLabel = item.risk_level === 'Red'
                          ? (lang === 'bn' ? 'উচ্চ ঝুঁকি' : 'High Risk')
                          : item.risk_level === 'Yellow'
                            ? (lang === 'bn' ? 'মাঝারি ঝুঁকি' : 'Moderate')
                            : item.risk_level === 'Green'
                              ? (lang === 'bn' ? 'নিরাপদ' : 'Safe')
                              : (lang === 'bn' ? 'অজানা' : 'Unknown')
                        return (
                          <li
                            key={item.id}
                            className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                                {item.risk_summary_en ?? (lang === 'bn' ? 'কোনো সারসংক্ষেপ নেই' : 'No summary')}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {item.total_calories !== null && (
                                  <span className="tabular-nums">{Math.round(item.total_calories)} kcal</span>
                                )}
                                {item.total_calories !== null && item.glycemic_load !== null && ' · '}
                                {item.glycemic_load !== null && (
                                  <span className="tabular-nums">GL {item.glycemic_load.toFixed(1)}</span>
                                )}
                                {' · '}
                                {formatDate(item.created_at)}
                              </p>
                            </div>
                            <Badge variant={riskBadge as 'destructive' | 'secondary' | 'outline'} className="shrink-0 ml-3">
                              {riskLabel}
                            </Badge>
                          </li>
                        )
                      })}
                    </ul>
                  </>
                )}

                {/* Current session result */}
                {result && (
                  <div className="mt-4 rounded-2xl border border-gray-200/50 bg-white/90 backdrop-blur-sm p-6 dark:border-gray-700/60 dark:bg-gray-900/90">
                    <p className="mb-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {lang === 'bn' ? 'সর্বশেষ বিশ্লেষণ' : 'Latest Analysis'}
                    </p>
                    <div className="flex items-center justify-center">
                      <NutritionDonutChart
                        carbsG={result.totalCarbs}
                        proteinG={result.totalProtein}
                        fatG={result.totalFat}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Bottom disclaimer */}
        {state !== 'disclaimer' && (
          <p className="text-center text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
            {lang === 'bn'
              ? 'ShasthyaHub-AI একটি AI স্ক্রিনিং টুল, ক্লিনিকাল রোগ নির্ণয় নয়। স্বাস্থ্য সংক্রান্ত সিদ্ধান্ত নেওয়ার আগে সর্বদা একজন যোগ্য চিকিৎসকের পরামর্শ নিন।'
              : 'ShasthyaHub-AI is an AI screening tool, not a clinical diagnosis. Always consult a qualified medical professional before making health decisions.'}
          </p>
        )}
      </div>
      </div>
    </>
  )
}
