'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Play, RotateCcw } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { DisclaimerModal } from '@/components/shared/DisclaimerModal'
import { AnalyzingAnimation } from '@/components/features/nayan-ai/AnalyzingAnimation'
import { EyeResultCard } from '@/components/features/nayan-ai/EyeResultCard'
import { Button } from '@/components/ui/button'
import type { NayanResult } from '@/types'

/**
 * Demo page — mirrors the production NayanAI UI but runs on a hardcoded
 * sample result so it works without auth, Supabase, or the AI pipeline.
 *
 * NOTE: a real sample image can be placed at /public/demo/sample-eye.jpg
 * to show a preview; the Run Demo button works without it.
 */
const DEMO_RESULT: NayanResult = {
  id: 'demo-0000-nayan-sample',
  diagnosis: 'Possible Cataract',
  severity: 'Medium',
  recommendation_en:
    'You may have early signs of a cataract. Please visit an eye doctor for a full exam within the next few weeks.',
  recommendation_bn:
    'আপনার ছানি পড়ার প্রাথমিক লক্ষণ থাকতে পারে। আগামী কয়েক সপ্তাহের মধ্যে একজন চিকিৎসকের কাছে যান।',
  urgency_days: 30,
  next_steps: [
    'Book an appointment with an ophthalmologist',
    'Bring this report and any old prescriptions',
    'Avoid rubbing your eyes',
  ],
  specialist_needed: 'Ophthalmologist',
  confidence_score: 78,
}

type DemoState = 'idle' | 'processing' | 'complete'

export default function DemoNayanAIPage() {
  const { lang } = useLanguage()
  const [state, setState] = useState<DemoState>('idle')
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  const runDemo = () => {
    setShowDisclaimer(false)
    setState('processing')
    // Mimic the real pipeline latency so the animation is visible.
    setTimeout(() => setState('complete'), 3500)
  }

  const handleRunClick = () => {
    setState('processing')
    setTimeout(() => setState('complete'), 3500)
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

      <div className="mx-auto min-h-screen max-w-3xl space-y-6 p-4 md:p-6">
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
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500">
            <Eye className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 md:text-2xl">
              {lang === 'bn' ? '🧿 নয়ান AI — ডেমো' : '🧿 NayanAI — Demo'}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {lang === 'bn'
                ? 'এটি একটি নমুনা ফলাফল — আপনার নিজের ছবি বিশ্লেষণ করতে মূল পেজে যান।'
                : 'This is a sample result — go to the main page to analyze your own photo.'}
            </p>
          </div>
        </div>

        {/* Run demo (idle + complete both show the button) */}
        {state !== 'processing' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/50 p-8 text-center dark:border-sky-900/50 dark:bg-sky-900/10">
              <Eye className="mx-auto mb-3 h-10 w-10 text-sky-400" />
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {lang === 'bn'
                  ? 'নমুনা চোখের ছবি দিয়ে ডেমো চালান'
                  : 'Run the demo with a sample eye image'}
              </p>
              <Button
                onClick={handleRunClick}
                className="rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-8 py-5 text-base font-semibold text-white hover:opacity-90"
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
            <EyeResultCard result={DEMO_RESULT} lang={lang} />
            <div className="mt-4">
              <Button onClick={reset} variant="outline" className="w-full rounded-xl">
                <RotateCcw className="mr-2 h-4 w-4" />
                {lang === 'bn' ? 'আবার চালান' : 'Run Again'}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </>
  )
}
