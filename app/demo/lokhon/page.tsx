'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Play, RotateCcw } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { DisclaimerModal } from '@/components/shared/DisclaimerModal'
import { AnalyzingAnimation } from '@/components/shared/AnalyzingAnimation'
import { LokhonResultCard } from '@/components/features/lokhon/LokhonResultCard'
import { Button } from '@/components/ui/button'
import type { LokhonResult } from '@/types'

const DEMO_RESULT: LokhonResult = {
  id: 'demo-lokhon-sample',
  riskPercentage: 68,
  riskBand: 'High',
  isRedFlag: true,
  advice: {
    advice_en: 'Avoid strenuous activity immediately. Rest and monitor your symptoms closely. Reduce salt and oil intake.',
    advice_bn: 'অবিলম্বে কঠোর কার্যকলাপ বন্ধ করুন। বিশ্রাম নিন এবং লক্ষণগুলি নিবিড়ভাবে পর্যবেক্ষণ করুন। লবণ ও তেল কমান।',
    doctor_type_en: 'Cardiologist — seek medical attention within a few days',
    doctor_type_bn: 'হৃদরোগ বিশেষজ্ঞ — কয়েক দিনের মধ্যে চিকিৎসা নিন',
    urgency: 'Urgent',
  },
  disclaimer: 'This tool does not replace professional diagnosis. Please consult a doctor for proper evaluation. / এই টুল পেশাদার রোগ নির্ণয়ের বিকল্প নয়। সঠিক মূল্যায়নের জন্য একজন ডাক্তারের পরামর্শ নিন।',
  diseaseSlug: 'heart',
  diseaseNameEn: 'Heart Disease',
  diseaseNameBn: 'হৃদরোগ',
  topSymptoms: [
    { text_en: 'Chest pain or discomfort when walking fast', text_bn: 'দ্রুত হাঁটলে বুকে ব্যথা', value: 4 },
    { text_en: 'Shortness of breath with mild activity', text_bn: 'সামান্য কাজে শ্বাসকষ্ট', value: 5 },
    { text_en: 'Pain radiating to left arm or jaw', text_bn: 'বাম হাত বা চোয়ালে ব্যথা', value: 3 },
  ],
}

type DemoState = 'idle' | 'processing' | 'complete'

export default function DemoLokhonPage() {
  const { lang } = useLanguage()
  const [state, setState] = useState<DemoState>('idle')
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  const runDemo = () => {
    setShowDisclaimer(false)
    setState('processing')
    setTimeout(() => setState('complete'), 3000)
  }

  const handleRunClick = () => {
    setState('processing')
    setTimeout(() => setState('complete'), 3000)
  }

  const reset = () => setState('idle')

  return (
    <>
      <DisclaimerModal
        open={showDisclaimer}
        onOpenChange={setShowDisclaimer}
        onAccept={runDemo}
      />

      {state === 'processing' && <AnalyzingAnimation />}

      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-rose-50/60 via-amber-50/30 to-orange-50/50 dark:from-gray-950 dark:via-rose-950/30 dark:to-amber-950/20 animate-gradient-bg z-0 motion-reduce:animate-none">
        <div className="absolute -left-32 top-10 h-[700px] w-[700px] rounded-full bg-rose-300/40 dark:bg-rose-500/20 blur-[140px]" />
        <div className="absolute -right-32 top-40 h-[700px] w-[700px] rounded-full bg-amber-300/35 dark:bg-amber-500/20 blur-[140px]" />
      </div>

      <div className="relative min-h-screen z-10">
        <div className="relative z-10 mx-auto max-w-3xl space-y-6 p-4 md:p-6">
          {/* Demo banner */}
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-900/20">
            <span className="text-lg">🎯</span>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {lang === 'bn'
                ? 'ডেমো মোড — নমুনা তথ্য ব্যবহার করা হচ্ছে (কোনো আসল AI কল নেই)'
                : 'Demo Mode — using sample data (no real AI call)'}
            </p>
          </div>

          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-500">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 md:text-2xl">
                {lang === 'bn' ? '🧿 লোকন — ডেমো' : '🧿 Lokhon — Demo'}
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {lang === 'bn'
                  ? 'এটি একটি নমুনা ফলাফল — আপনার নিজের লক্ষণ পরীক্ষা করতে মূল পেজে যান।'
                  : 'This is a sample result — go to the main page to check your own symptoms.'}
              </p>
            </div>
          </div>

          {/* Run demo */}
          {state !== 'processing' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-white/90 backdrop-blur-sm p-8 text-center dark:border-rose-800/50 dark:bg-gray-900/90 dark:backdrop-blur-sm shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
                <Activity className="mx-auto mb-3 h-10 w-10 text-rose-400" />
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  {lang === 'bn'
                    ? 'নমুনা লক্ষণ পরীক্ষা ডেমো চালান'
                    : 'Run the demo with sample symptom screening'}
                </p>
                <Button
                  onClick={handleRunClick}
                  className="rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 bg-[length:200%_100%] animate-gradient-x px-8 py-5 text-base font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
                >
                  <Play className="mr-2 h-5 w-5" />
                  {lang === 'bn' ? 'ডেমো চালান' : 'Run Demo'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Result */}
          {state === 'complete' && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
              <LokhonResultCard result={DEMO_RESULT} lang={lang} />
              <div className="mt-4">
                <Button onClick={reset} className="w-full rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 bg-[length:200%_100%] animate-gradient-x text-white font-semibold shadow-md hover:shadow-lg active:scale-[0.99] transition-all">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {lang === 'bn' ? 'আবার চালান' : 'Run Again'}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  )
}
