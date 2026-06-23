'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Language } from '@/types'

interface AnalyzingAnimationProps {
  /** Override the language; defaults to the LanguageContext value. */
  lang?: Language
}

/** Bilingual status stages cycled through during analysis. */
const STAGES: { en: string; bn: string }[] = [
  {
    en: '📡 Sending to Vision Engine...',
    bn: '📡 ভিশন ইঞ্জিনে পাঠানো হচ্ছে...',
  },
  {
    en: '🔬 Analyzing eye patterns...',
    bn: '🔬 চোখের ধরণ বিশ্লেষণ করা হচ্ছে...',
  },
  {
    en: '🧠 Generating medical report...',
    bn: '🧠 মেডিকেল রিপোর্ট তৈরি হচ্ছে...',
  },
  {
    en: '✅ Almost done...',
    bn: '✅ প্রায় শেষ...',
  },
]

const STAGE_INTERVAL_MS = 4000

/**
 * Full-screen overlay shown while the eye analysis pipeline runs.
 *
 * Renders a dark scrim with a centered white card containing a CSS-free,
 * framer-motion-animated eye iris (pupil slowly expanding/contracting),
 * three bouncing dots, and a rotating bilingual status message.
 */
export function AnalyzingAnimation({ lang: langProp }: AnalyzingAnimationProps) {
  const { lang: langCtx } = useLanguage()
  const lang = langProp ?? langCtx
  const [stageIndex, setStageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((i) => (i + 1) % STAGES.length)
    }, STAGE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const stage = STAGES[stageIndex]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-2xl bg-white p-8 text-center dark:bg-gray-800"
      >
        {/* Animated eye iris */}
        <div className="relative mx-auto mb-7 flex h-28 w-28 items-center justify-center">
          {/* Outer sclera ring */}
          <div className="absolute inset-0 rounded-full border-4 border-sky-100 dark:border-sky-900/50" />
          {/* Iris — animates the scale slowly to mimic a focusing pupil */}
          <motion.div
            className="absolute h-20 w-20 rounded-full bg-gradient-to-br from-sky-400 to-sky-600"
            animate={{ scale: [1, 1.18, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Pupil — contracts/expands inside the iris */}
          <motion.div
            className="absolute h-9 w-9 rounded-full bg-gray-900 dark:bg-black"
            animate={{ scale: [1, 0.7, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Specular highlight */}
          <motion.div
            className="absolute left-11 top-9 h-3 w-3 rounded-full bg-white/90"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Three bouncing dots */}
        <div className="mb-6 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-sky-500"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        {/* Rotating status text */}
        <div className="flex h-12 items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={stageIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              {lang === 'bn' ? stage.bn : stage.en}
            </motion.p>
          </AnimatePresence>
        </div>

        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          {lang === 'bn' ? 'সাধারণত ১০–১৫ সেকেন্ড লাগে' : 'Usually takes 10–15 seconds'}
        </p>
      </motion.div>
    </motion.div>
  )
}
