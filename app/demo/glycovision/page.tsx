'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Apple, BarChart3, Heart, Play, RotateCcw, Salad, Sparkles, Utensils } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { DisclaimerModal } from '@/components/shared/DisclaimerModal'
import { ResultCard } from '@/components/shared/ResultCard'
import FoodItemsList from '@/components/features/glycovision/FoodItemsList'
import NutritionDonutChart from '@/components/features/glycovision/NutritionDonutChart'
import RiskScoreCard from '@/components/features/glycovision/RiskScoreCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type {
  ChronicDiseaseRisk,
  EnrichedFoodItem,
  GlycoVisionResult,
  MealModification,
} from '@/types'

// --- Hardcoded demo data (Bangladeshi meal) ---

const DEMO_ITEMS: EnrichedFoodItem[] = [
  {
    name_en: 'Rice (White, cooked)',
    name_bn: 'সাদা ভাত',
    estimated_grams: 250,
    calories: 325,
    carbs_g: 71.5,
    protein_g: 6.8,
    fat_g: 0.7,
    confidence: 0.95,
  },
  {
    name_en: 'Daal (Red Lentil)',
    name_bn: 'মসুর ডাল',
    estimated_grams: 120,
    calories: 140,
    carbs_g: 24,
    protein_g: 10.5,
    fat_g: 0.5,
    confidence: 0.92,
  },
  {
    name_en: 'Rui Fish Curry',
    name_bn: 'রুই মাছের ঝোল',
    estimated_grams: 150,
    calories: 195,
    carbs_g: 3,
    protein_g: 24,
    fat_g: 10,
    confidence: 0.88,
  },
  {
    name_en: 'Aloo Bhorta (Mashed Potato)',
    name_bn: 'আলু ভর্তা',
    estimated_grams: 80,
    calories: 110,
    carbs_g: 20,
    protein_g: 2.2,
    fat_g: 3,
    confidence: 0.85,
  },
  {
    name_en: 'Shobji Bhaji (Mixed Vegetables)',
    name_bn: 'শবজি ভাজি',
    estimated_grams: 100,
    calories: 65,
    carbs_g: 8,
    protein_g: 2.5,
    fat_g: 3.5,
    confidence: 0.82,
  },
]

const DEMO_RISKS: ChronicDiseaseRisk[] = [
  {
    disease_en: 'Type 2 Diabetes',
    disease_bn: 'টাইপ ২ ডায়াবেটিস',
    status: 'Caution',
    reason_bn: 'এই খাবারে কার্বোহাইড্রেটের পরিমাণ বেশি (১২৬.৫ গ্রাম), যা রক্তে শর্করা বাড়াতে পারে। ভাতের পরিমাণ কমানো ভালো।',
  },
  {
    disease_en: 'Hypertension (High Blood Pressure)',
    disease_bn: 'উচ্চ রক্তচাপ',
    status: 'Safe',
    reason_bn: 'এই খাবারে সোডিয়ামের পরিমাণ নিয়ন্ত্রণে আছে। তাজা মাছ ও সবজি হৃদযন্ত্রের জন্য উপকারী।',
  },
  {
    disease_en: 'Heart Disease',
    disease_bn: 'হৃদরোগ',
    status: 'Safe',
    reason_bn: 'রুই মাছ ওমেগা-৩ ফ্যাটি এসিড সমৃদ্ধ এবং সবজি ফাইবার সরবরাহ করে — হৃদযন্ত্রের জন্য ভালো। তবে তেলের পরিমাণ নিয়ন্ত্রণে রাখা উচিত।',
  },
]

const DEMO_MODIFICATIONS: MealModification[] = [
  {
    suggestion_en: 'Replace half the rice with salad to reduce glycemic load',
    suggestion_bn: 'গ্লাইসেমিক লোড কমাতে অর্ধেক ভাতের পরিবর্তে সালাদ খান',
    impact: 'positive',
    nutrient: 'Carbs',
    current_value: 71.5,
    suggested_value: 36,
    calories_saved: 142,
  },
  {
    suggestion_en: 'Use less oil in the fish curry — try steaming instead',
    suggestion_bn: 'মাছের ঝোলে তেল কমান — স্টিম করে রান্না করার চেষ্টা করুন',
    impact: 'positive',
    nutrient: 'Fat',
    current_value: 10,
    suggested_value: 5,
    calories_saved: 45,
  },
  {
    suggestion_en: 'Add a side of fresh salad (shobji) for more fiber',
    suggestion_bn: 'আরও ফাইবারের জন্য তাজা সালাদ যোগ করুন',
    impact: 'positive',
    nutrient: 'Fiber',
    current_value: 0,
    suggested_value: 5,
    calories_saved: 0,
  },
]

const DEMO_RESULT: GlycoVisionResult = {
  id: 'demo-glycovision-0001',
  identified_items: DEMO_ITEMS,
  total_calories: 835,
  total_carbs_g: 126.5,
  total_protein_g: 46,
  total_fat_g: 17.7,
  glycemic_load: 48,
  risk_level: 'Yellow',
  risk_summary_en:
    'This meal has a moderate glycemic load. The rice and potato contribute most of the carbs. Consider reducing the rice portion or swapping half for a salad to lower the impact on blood sugar.',
  risk_summary_bn:
    'এই খাবারের গ্লাইসেমিক লোড মাঝারি। ভাত ও আলু সবচেয়ে বেশি কার্বোহাইড্রেট সরবরাহ করছে। রক্তে শর্করার প্রভাব কমাতে ভাতের পরিমাণ কমানো বা অর্ধেক ভাতের পরিবর্তে সালাদ খাওয়ার পরামর্শ দেওয়া হচ্ছে।',
  chronic_disease_risks: DEMO_RISKS,
  meal_modifications: DEMO_MODIFICATIONS,
}

const RISK_GLYCOVISION_EMOJI_MAP: Record<string, string> = {
  'Type 2 Diabetes': '🩸',
  'Hypertension (High Blood Pressure)': '💓',
  'Heart Disease': '❤️‍🩹',
}

const RISK_STATUS_CONFIG = {
  Danger: {
    labelEn: 'High Risk', labelBn: 'উচ্চ ঝুঁকি',
    border: 'border-red-200 dark:border-red-800', bg: 'bg-red-50 dark:bg-red-950/40',
    badgeBg: 'bg-red-100 dark:bg-red-900/60', badgeText: 'text-red-700 dark:text-red-300',
  },
  Caution: {
    labelEn: 'Moderate Risk', labelBn: 'মাঝারি ঝুঁকি',
    border: 'border-amber-200 dark:border-amber-800', bg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/60', badgeText: 'text-amber-700 dark:text-amber-300',
  },
  Safe: {
    labelEn: 'Safe', labelBn: 'নিরাপদ',
    border: 'border-green-200 dark:border-green-800', bg: 'bg-green-50 dark:bg-green-950/40',
    badgeBg: 'bg-green-100 dark:bg-green-900/60', badgeText: 'text-green-700 dark:text-green-300',
  },
}

type DemoState = 'idle' | 'processing' | 'complete'
type ResultTab = 'overview' | 'nutrients' | 'risks' | 'suggestions'

export default function DemoGlycoVisionPage() {
  const { lang } = useLanguage()
  const [state, setState] = useState<DemoState>('idle')
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [resultTab, setResultTab] = useState<ResultTab>('overview')

  const runDemo = () => {
    setShowDisclaimer(false)
    setState('processing')
    setTimeout(() => setState('complete'), 2500)
  }

  const handleRunClick = () => {
    setState('processing')
    setTimeout(() => setState('complete'), 2500)
  }

  const reset = () => {
    setState('idle')
    setResultTab('overview')
  }

  const d = DEMO_RESULT

  const resultTabs: { key: ResultTab; labelEn: string; labelBn: string; icon: typeof BarChart3 }[] = [
    { key: 'overview', labelEn: 'Overview', labelBn: 'সারসংক্ষেপ', icon: BarChart3 },
    { key: 'nutrients', labelEn: 'Nutrients', labelBn: 'পুষ্টি', icon: Apple },
    { key: 'risks', labelEn: 'Risks', labelBn: 'ঝুঁকি', icon: Heart },
    { key: 'suggestions', labelEn: 'Suggestions', labelBn: 'পরামর্শ', icon: Salad },
  ]

  return (
    <>
      <DisclaimerModal
        open={showDisclaimer}
        onOpenChange={setShowDisclaimer}
        onAccept={runDemo}
      />

      {state === 'processing' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500">
              <Utensils className="h-8 w-8 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {lang === 'bn' ? 'খাদ্য বিশ্লেষণ করা হচ্ছে...' : 'Analyzing meal...'}
            </p>
          </motion.div>
        </div>
      )}

      {/* Dynamic Animated Fixed Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-gray-50 via-amber-50/30 to-orange-50/20 dark:from-gray-950 dark:via-amber-950/30 dark:to-orange-950/20 animate-gradient-bg z-0">
        {/* Ambient Radial Gradient Blobs */}
        <div className="absolute -left-32 top-10 h-[700px] w-[700px] rounded-full bg-amber-300/40 dark:bg-amber-500/20 blur-[140px] animate-float-1" />
        <div className="absolute -right-32 top-40 h-[700px] w-[700px] rounded-full bg-orange-300/35 dark:bg-orange-500/20 blur-[140px] animate-float-2" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[500px] w-[800px] rounded-full bg-yellow-200/25 dark:bg-yellow-600/15 blur-[160px] animate-float-3" />
      </div>

      <div className="relative min-h-screen z-10">
        <div className="relative z-10 mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        {/* Demo mode banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/60">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
              {lang === 'bn' ? '✨ ডেমো মোড — বাংলাদেশি খাবার' : '✨ Demo Mode — Bangladeshi Meal'}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {lang === 'bn'
                ? 'ভাত, ডাল, রুই মাছের ঝোল, আলু ভর্তা ও শবজি ভাজি — একটি সাধারণ বাংলাদেশি খাবারের বিশ্লেষণ।'
                : 'Rice, daal, rui fish curry, aloo bhorta & shobji bhaji — a typical Bangladeshi meal.'}
            </p>
          </div>
        </motion.div>

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
            <Utensils className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 md:text-2xl">
              {lang === 'bn' ? 'গ্লাইকোভিশন — ডেমো' : 'GlycoVision — Demo'}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {lang === 'bn'
                ? 'নিচে একটি নমুনা বাংলাদেশি খাবারের সম্পূর্ণ পুষ্টি বিশ্লেষণ দেখানো হয়েছে।'
                : 'Below is a full nutrition analysis of a sample Bangladeshi meal.'}
            </p>
          </div>
        </div>

        {/* Run demo / Results */}
        {state !== 'complete' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-white/90 backdrop-blur-sm p-8 text-center dark:border-amber-800/50 dark:bg-gradient-to-br dark:from-gray-900/90 dark:to-gray-800/70 shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
              <Utensils className="mx-auto mb-3 h-10 w-10 text-amber-400" />
              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {lang === 'bn'
                  ? 'একটি সাধারণ বাংলাদেশি খাবার'
                  : 'A typical Bangladeshi meal'}
              </p>
              <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
                {lang === 'bn'
                  ? 'ভাত, ডাল, রুই মাছ, আলু ভর্তা ও শবজি'
                  : 'Rice, Daal, Rui Fish, Aloo Bhorta & Shobji'}
              </p>
              <Button
                onClick={handleRunClick}
                className="rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-[length:200%_100%] animate-gradient-x px-8 py-5 text-base font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
              >
                <Play className="mr-2 h-5 w-5" />
                {lang === 'bn' ? 'ডেমো চালান' : 'Run Demo'}
              </Button>
            </div>
          </motion.div>
        )}

        {state === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
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
            <motion.div key={resultTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {/* Overview */}
              {resultTab === 'overview' && (
                <div className="space-y-4">
                  <RiskScoreCard
                    riskLevel={d.risk_level}
                    glycemicLoad={d.glycemic_load}
                    summaryEn={d.risk_summary_en}
                    summaryBn={d.risk_summary_bn}
                    lang={lang}
                  />
                  <ResultCard
                    title={lang === 'bn' ? 'খাদ্য তালিকা' : 'Food Items'}
                    badge={{ label: `${d.identified_items.length} ${lang === 'bn' ? 'টি' : 'items'}`, variant: 'default' }}
                  >
                    <div className="pt-3">
                      <FoodItemsList items={d.identified_items} lang={lang} />
                    </div>
                  </ResultCard>
                </div>
              )}

              {/* Nutrients */}
              {resultTab === 'nutrients' && (
                <ResultCard title={lang === 'bn' ? 'পুষ্টি বিশ্লেষণ' : 'Nutrient Analysis'}>
                  <div className="pt-3">
                    <NutritionDonutChart
                      carbsG={d.total_carbs_g}
                      proteinG={d.total_protein_g}
                      fatG={d.total_fat_g}
                    />
                  </div>
                </ResultCard>
              )}

              {/* Risks */}
              {resultTab === 'risks' && (
                <ResultCard title={lang === 'bn' ? 'দীর্ঘমেয়াদী স্বাস্থ্য ঝুঁকি' : 'Chronic Disease Risks'}>
                  <div className="space-y-3 pt-3">
                    {d.chronic_disease_risks.map((disease) => {
                      const cfg = RISK_STATUS_CONFIG[disease.status]
                      const emoji = RISK_GLYCOVISION_EMOJI_MAP[disease.disease_en] ?? '⚕️'
                      return (
                        <div key={disease.disease_en} className={cn('rounded-xl border p-4', cfg.bg, cfg.border)}>
                          <div className="mb-2.5 flex items-start justify-between">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="shrink-0 text-lg">{emoji}</span>
                              <span className="text-xs font-semibold leading-tight text-gray-700 dark:text-gray-300">
                                {disease.disease_bn}
                              </span>
                            </div>
                          </div>
                          <div className={cn('mb-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold', cfg.badgeBg, cfg.badgeText)}>
                            <Heart className="h-3 w-3" />
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

              {/* Suggestions */}
              {resultTab === 'suggestions' && (
                <ResultCard title={lang === 'bn' ? 'পরামর্শ ও পরিবর্তন' : 'Suggestions & Modifications'}>
                  <div className="space-y-3 pt-3">
                    {d.meal_modifications.map((mod, i) => (
                      <div
                        key={i}
                        className={cn(
                          'rounded-xl border-l-4 p-4',
                          mod.impact === 'positive'
                            ? 'border-l-green-500 bg-green-50 dark:bg-green-950/30'
                            : 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/30'
                        )}
                      >
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {lang === 'bn' ? mod.suggestion_bn : mod.suggestion_en}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-semibold uppercase">{mod.nutrient}</span>
                          <span className="line-through">{mod.current_value}{mod.nutrient === 'Calories' ? 'kcal' : mod.nutrient === 'Fiber' ? 'g' : 'g'}</span>
                          <span className="text-green-600 dark:text-green-400">→ {mod.suggested_value}{mod.nutrient === 'Calories' ? 'kcal' : mod.nutrient === 'Fiber' ? 'g' : 'g'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ResultCard>
              )}
            </motion.div>

            {/* Run again */}
            <Button onClick={reset} className="w-full rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-[length:200%_100%] animate-gradient-x text-white font-semibold shadow-md hover:shadow-lg active:scale-[0.99] transition-all">
              <RotateCcw className="mr-2 h-4 w-4" />
              {lang === 'bn' ? 'আবার চালান' : 'Run Again'}
            </Button>
          </motion.div>
        )}
      </div>
      </div>
    </>
  )
}
