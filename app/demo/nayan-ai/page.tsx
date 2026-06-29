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

      {/* Dynamic Animated Fixed Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-gray-50 via-violet-50/25 to-indigo-50/20 dark:from-gray-950 dark:via-violet-950/30 dark:to-indigo-950/20 animate-gradient-bg z-0 motion-reduce:animate-none motion-reduce:bg-gray-50 motion-reduce:dark:bg-gray-950">
        {/* Ambient Radial Gradient Blobs */}
        <div className="absolute -left-32 top-10 h-[700px] w-[700px] rounded-full bg-violet-300/35 dark:bg-violet-500/15 blur-[140px] motion-reduce:hidden animate-float-1" />
        <div className="absolute -right-32 top-40 h-[700px] w-[700px] rounded-full bg-indigo-300/30 dark:bg-indigo-500/15 blur-[140px] motion-reduce:hidden animate-float-2" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[500px] w-[800px] rounded-full bg-purple-200/25 dark:bg-purple-500/10 blur-[160px] motion-reduce:hidden animate-float-3" />
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
            <div className="rounded-2xl border-2 border-dashed border-sky-200 bg-white/90 backdrop-blur-sm p-8 text-center dark:border-sky-800/50 dark:bg-gray-900/90 dark:backdrop-blur-sm shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
              <Eye className="mx-auto mb-3 h-10 w-10 text-sky-400" />
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {lang === 'bn'
                  ? 'নমুনা চোখের ছবি দিয়ে ডেমো চালান'
                  : 'Run the demo with a sample eye image'}
              </p>
              <Button
                onClick={handleRunClick}
                className="rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-[length:200%_100%] animate-gradient-x px-8 py-5 text-base font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
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
              <Button onClick={reset} className="w-full rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold shadow-md hover:shadow-lg active:scale-[0.99] transition-all">
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
