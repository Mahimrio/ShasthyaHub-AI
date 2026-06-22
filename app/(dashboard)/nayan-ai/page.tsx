'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Eye, Info, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { DisclaimerModal } from '@/components/shared/DisclaimerModal'
import { AiThinkingBanner } from '@/components/shared/AiThinkingBanner'
import { ResultCard } from '@/components/shared/ResultCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type AnalysisState = 'idle' | 'disclaimer' | 'uploading' | 'processing' | 'complete'
type SeverityLevel = 'Normal' | 'Low' | 'Medium' | 'High' | 'Critical'

const severityConfig: Record<SeverityLevel, { border: string; bg: string; badge: 'green' | 'low' | 'medium' | 'high' | 'critical'; text: string; dot: string }> = {
  Normal:   { border: 'border-l-4 border-green-500', bg: 'bg-green-50 dark:bg-green-900/30', badge: 'green', text: 'text-green-800 dark:text-green-200', dot: 'bg-green-500' },
  Low:      { border: 'border-l-4 border-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30', badge: 'low', text: 'text-blue-800 dark:text-blue-200', dot: 'bg-blue-500' },
  Medium:   { border: 'border-l-4 border-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/30', badge: 'medium', text: 'text-yellow-800 dark:text-yellow-200', dot: 'bg-yellow-500' },
  High:     { border: 'border-l-4 border-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/30', badge: 'high', text: 'text-orange-800 dark:text-orange-200', dot: 'bg-orange-500' },
  Critical: { border: 'border-l-4 border-red-500', bg: 'bg-red-50 dark:bg-red-900/30', badge: 'critical', text: 'text-red-800 dark:text-red-200', dot: 'bg-red-500' },
}

export default function NayanAIPage() {
  const { lang } = useLanguage()
  const [state, setState] = useState<AnalysisState>('disclaimer')
  const [showDisclaimer, setShowDisclaimer] = useState(true)

  const [result] = useState<{
    severity: SeverityLevel
    diagnosis: string
    diagnosisBn: string
    confidence: number
    recommendationEn: string
    recommendationBn: string
    urgencyDays: number
    specialist: string
    details: string
  } | null>({
    severity: 'High',
    diagnosis: 'Suspected Diabetic Retinopathy (NPDR)',
    diagnosisBn: 'সন্দেহভাজন ডায়াবেটিক রেটিনোপ্যাথি (NPDR)',
    confidence: 87,
    recommendationEn: 'Visit an ophthalmologist within 14 days for a dilated eye exam.',
    recommendationBn: '১৪ দিনের মধ্যে একজন চক্ষু বিশেষজ্ঞের কাছে যান।',
    urgencyDays: 14,
    specialist: 'Ophthalmologist / Vitreo-Retinal Surgeon',
    details: 'Mild non-proliferative diabetic retinopathy with microaneurysms detected. No signs of macular edema currently.',
  })

  const handleAcceptDisclaimer = useCallback(() => {
    setShowDisclaimer(false)
    setState('idle')
  }, [])

  const handleImageSelect = useCallback((_imageFile: File) => {
    setState('processing')
    setTimeout(() => setState('complete'), 3000)
  }, [])

  const severity = result ? severityConfig[result.severity] : null

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
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <Eye className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
              {lang === 'bn' ? 'নয়ান AI — চোখের পরীক্ষা' : 'Nayan AI — Eye Screening'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              {lang === 'bn'
                ? 'ডায়াবেটিক রেটিনোপ্যাথি শনাক্ত করতে আপনার চোখের ছবি আপলোড করুন। AI বিশ্লেষণ করে ফলাফল দেবে।'
                : 'Upload a clear photo of your eye to screen for diabetic retinopathy.'}
            </p>
          </div>
        </div>

        {/* Upload Section */}
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
                ? 'সরাসরি ছবি তুলতে ক্যামেরা ব্যবহার করুন অথবা গ্যালারি থেকে বেছে নিন'
                : 'Use your camera to take a photo or choose from gallery'}
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
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
              {lang === 'bn' ? 'সাধারণত ১০-১৫ সেকেন্ড লাগে' : 'Usually takes 10-15 seconds'}
            </p>
          </motion.div>
        )}

        {/* Results */}
        {state === 'complete' && result && severity && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Am I in danger? */}
            <div className={`${severity.border} ${severity.bg} pl-4 pr-5 py-4 rounded-r-xl`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${severity.dot}`} />
                <Badge variant={severity.badge}>
                  {result.severity === 'Critical'
                    ? (lang === 'bn' ? 'গুরুতর' : 'Critical')
                    : result.severity === 'High'
                      ? (lang === 'bn' ? 'উচ্চ ঝুঁকি' : 'High Risk')
                      : result.severity === 'Medium'
                        ? (lang === 'bn' ? 'মাঝারি ঝুঁকি' : 'Medium Risk')
                        : result.severity === 'Low'
                          ? (lang === 'bn' ? 'কম ঝুঁকি' : 'Low Risk')
                          : (lang === 'bn' ? 'স্বাভাবিক' : 'Normal')}
                </Badge>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{result.confidence}% confidence</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 mt-1 leading-tight">
                {lang === 'bn' ? result.diagnosisBn : result.diagnosis}
              </h2>
            </div>

            {/* What to do & How soon */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-700 p-5 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/50 rounded-lg flex items-center justify-center shrink-0">
                  <Info className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                    {lang === 'bn' ? '✅ আপনার করণীয়' : '✅ Recommended Action'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    {lang === 'bn' ? result.recommendationBn : result.recommendationEn}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-sm">
                    <span className="text-gray-400 dark:text-gray-500">
                      {lang === 'bn' ? 'সময়সীমা:' : 'Timeline:'}
                    </span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {lang === 'bn'
                        ? `${result.urgencyDays} দিনের মধ্যে`
                        : `Within ${result.urgencyDays} days`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Specialist info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-700 p-5 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center shrink-0">
                  <ArrowRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                    {lang === 'bn' ? 'কোন ডাক্তার দেখাবেন' : 'Who to See'}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 font-medium">{result.specialist}</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <ResultCard
              title={lang === 'bn' ? 'বিশদ বিশ্লেষণ' : 'Detailed Analysis'}
            >
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {lang === 'bn'
                  ? 'ছবিতে মাইক্রোঅ্যানিউরিজম সহ হালকা নন-প্রলিফারেটিভ ডায়াবেটিক রেটিনোপ্যাথি (NPDR) শনাক্ত হয়েছে। বর্তমানে ম্যাকুলার এডিমার কোনো লক্ষণ নেই।'
                  : result.details}
              </p>
            </ResultCard>

            {/* Re-analyze */}
            <div className="flex gap-3">
              <Button
                onClick={() => { setState('idle') }}
                variant="outline"
                className="flex-1 rounded-xl"
              >
                {lang === 'bn' ? 'নতুন ছবি আপলোড করুন' : 'Upload New Image'}
              </Button>
            </div>
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
