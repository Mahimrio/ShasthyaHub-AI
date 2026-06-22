'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Utensils, Flame, Wheat, Beef, Droplet, Activity } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { DisclaimerModal } from '@/components/shared/DisclaimerModal'
import { AiThinkingBanner } from '@/components/shared/AiThinkingBanner'
import { ResultCard } from '@/components/shared/ResultCard'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AnalysisState = 'idle' | 'disclaimer' | 'uploading' | 'processing' | 'complete'
type RiskLevel = 'Green' | 'Yellow' | 'Red'

interface FoodItem {
  nameEn: string
  nameBn: string
  grams: number
  calories: number
  carbs: number
  protein: number
  fat: number
  confidence: number
}

export default function GlycoVisionPage() {
  const { lang } = useLanguage()
  const [state, setState] = useState<AnalysisState>('disclaimer')
  const [showDisclaimer, setShowDisclaimer] = useState(true)

  const [items] = useState<FoodItem[]>([
    { nameEn: 'White Rice (Polao)', nameBn: 'পোলাও', grams: 250, calories: 415, carbs: 78, protein: 8.5, fat: 9.5, confidence: 92 },
    { nameEn: 'Chicken Curry', nameBn: 'মুরগির কারি', grams: 150, calories: 285, carbs: 6, protein: 32, fat: 15, confidence: 88 },
    { nameEn: 'Dal (Lentil Soup)', nameBn: 'ডাল', grams: 200, calories: 180, carbs: 30, protein: 14, fat: 2, confidence: 90 },
  ])

  const totals = {
    calories: items.reduce((s, i) => s + i.calories, 0),
    carbs: items.reduce((s, i) => s + i.carbs, 0),
    protein: items.reduce((s, i) => s + i.protein, 0),
    fat: items.reduce((s, i) => s + i.fat, 0),
  }

  const glycemicLoad = 58
  const riskLevel: RiskLevel = glycemicLoad > 50 ? 'Red' : glycemicLoad > 30 ? 'Yellow' : 'Green'

  const riskConfig = {
    Green: { labelEn: 'Low Impact', labelBn: 'কম প্রভাব', bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
    Yellow: { labelEn: 'Moderate Impact', labelBn: 'মাঝারি প্রভাব', bg: 'bg-yellow-50 dark:bg-yellow-900/30', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
    Red: { labelEn: 'High Impact', labelBn: 'উচ্চ প্রভাব', bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  }

  const risk = riskConfig[riskLevel]

  const handleAcceptDisclaimer = useCallback(() => {
    setShowDisclaimer(false)
    setState('idle')
  }, [])

  const handleImageSelect = useCallback((_imageFile: File) => {
    setState('processing')
    setTimeout(() => setState('complete'), 3000)
  }, [])

  return (
    <>
      <DisclaimerModal
        open={showDisclaimer}
        onOpenChange={setShowDisclaimer}
        onAccept={handleAcceptDisclaimer}
      />

      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <Utensils className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
              {lang === 'bn' ? 'গ্লাইকোভিশন — খাদ্য বিশ্লেষণ' : 'GlycoVision — Food Analysis'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              {lang === 'bn'
                ? 'আপনার খাবারের ছবি আপলোড করুন। AI ক্যালোরি, কার্বোহাইড্রেট, প্রোটিন ও ফ্যাট গণনা করবে এবং গ্লাইসেমিক লোড নির্ণয় করবে।'
                : 'Upload a photo of your meal to get calorie, carb, protein, and fat breakdown plus glycemic load assessment.'}
            </p>
          </div>
        </div>

        {/* Upload */}
        {state !== 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <ImageUploader
              onImageSelect={handleImageSelect}
              acceptedTypes="image/*"
              maxSizeMB={10}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
              {lang === 'bn'
                ? 'পুরো খাবারের ছবি তুলুন — একক উপাদান নয়'
                : 'Capture your full plate — not individual items'}
            </p>
          </motion.div>
        )}

        {/* Processing */}
        {state === 'processing' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AiThinkingBanner />
          </motion.div>
        )}

        {/* Results */}
        {state === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Glycemic Impact */}
            <div className={cn('rounded-2xl border pl-4 pr-5 py-4', risk.border, risk.bg)}>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('w-2 h-2 rounded-full', risk.dot)} />
                <span className={cn('text-sm font-bold', risk.text)}>
                  {lang === 'bn' ? risk.labelBn : risk.labelEn}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                  {lang === 'bn' ? 'গ্লাইসেমিক লোড:' : 'Glycemic Load:'} {glycemicLoad}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {riskLevel === 'Red'
                  ? (lang === 'bn' ? 'এই খাবারে কার্বোহাইড্রেটের পরিমাণ বেশি, যা রক্তে শর্করার মাত্রা দ্রুত বাড়াতে পারে। পরিমিত পরিমাণে খাওয়ার পরামর্শ দেওয়া হচ্ছে।' : 'High carbohydrate load — may cause rapid blood sugar spike. Consider smaller portions or substitute with lower-GI alternatives.')
                  : riskLevel === 'Yellow'
                    ? (lang === 'bn' ? 'মাঝারি গ্লাইসেমিক প্রভাব। পরিমাণ নিয়ন্ত্রণে রাখুন।' : 'Moderate glycemic impact. Monitor portion size.')
                    : (lang === 'bn' ? 'কম গ্লাইসেমিক প্রভাব — ডায়াবেটিস রোগীদের জন্য নিরাপদ।' : 'Low glycemic impact — safe for diabetic patients.')}
              </p>
            </div>

            {/* Macro Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-700 p-5 transition-colors">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                {lang === 'bn' ? 'পুষ্টি উপাদান' : 'Nutrition Breakdown'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Flame, value: totals.calories, unit: 'kcal', labelEn: 'Calories', labelBn: 'ক্যালোরি', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/50' },
                  { icon: Wheat, value: totals.carbs, unit: 'g', labelEn: 'Carbs', labelBn: 'কার্বোহাইড্রেট', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/50' },
                  { icon: Beef, value: totals.protein, unit: 'g', labelEn: 'Protein', labelBn: 'প্রোটিন', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/50' },
                  { icon: Droplet, value: totals.fat, unit: 'g', labelEn: 'Fat', labelBn: 'ফ্যাট', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/50' },
                ].map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div key={stat.labelEn} className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2', stat.bg)}>
                        <Icon className={cn('h-4 w-4', stat.color)} />
                      </div>
                      <p className="text-xl font-bold text-gray-800 dark:text-gray-100 tabular-nums">{stat.value}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">{stat.unit}</p>
                      <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">{lang === 'bn' ? stat.labelBn : stat.labelEn}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Food items */}
            <ResultCard
              title={lang === 'bn' ? 'শনাক্তকৃত খাদ্য' : 'Identified Foods'}
              badge={{ label: `${items.length} items`, variant: 'default' }}
            >
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {lang === 'bn' ? item.nameBn : item.nameEn}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {item.grams}g · {item.calories} kcal · C:{item.carbs}g P:{item.protein}g F:{item.fat}g
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Activity className="h-3 w-3 text-green-500" />
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">{item.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </ResultCard>

            {/* Suggestions */}
            <ResultCard
              title={lang === 'bn' ? 'পরামর্শ' : 'Suggestions'}
            >
              <div className="space-y-3">
                {glycemicLoad > 40 && (
                  <div className="border-l-4 border-green-500 pl-3 py-1.5">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {lang === 'bn' ? '💡 ভাতের পরিমাণ কমান' : '💡 Reduce rice portion'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {lang === 'bn'
                        ? 'পরবর্তী খাবারে ভাতের পরিবর্তে ১টি রুটি বা সালাদ যোগ করুন'
                        : 'Try replacing half the rice with a salad or one roti'}
                    </p>
                  </div>
                )}
                {totals.fat > 20 && (
                  <div className="border-l-4 border-green-500 pl-3 py-1.5">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {lang === 'bn' ? '💡 কম তেলে রান্না করুন' : '💡 Reduce cooking oil'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {lang === 'bn'
                        ? 'তেলের পরিমাণ কমিয়ে বা গ্রিল/স্টিম করে রান্না করতে পারেন'
                        : 'Consider grilling or steaming instead of frying'}
                    </p>
                  </div>
                )}
              </div>
            </ResultCard>

            {/* Re-upload */}
            <Button
              onClick={() => setState('idle')}
              variant="outline"
              className="w-full rounded-xl"
            >
              {lang === 'bn' ? 'নতুন খাবারের ছবি আপলোড করুন' : 'Upload New Meal'}
            </Button>
          </motion.div>
        )}

        {/* Bottom disclaimer */}
        {state !== 'disclaimer' && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed text-center">
            {lang === 'bn'
              ? 'ShasthyaHub-AI একটি AI স্ক্রিনিং টুল, ক্লিনিকাল রোগ নির্ণয় নয়। স্বাস্থ্য সংক্রান্ত সিদ্ধান্ত নেওয়ার আগে সর্বদা একজন যোগ্য চিকিৎসকের পরামর্শ নিন।'
              : 'ShasthyaHub-AI is an AI screening tool, not a clinical diagnosis. Always consult a qualified medical professional before making health decisions.'}
          </p>
        )}
      </div>
    </>
  )
}
