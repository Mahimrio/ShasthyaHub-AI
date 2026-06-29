'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Language } from '@/types'

interface AnalyzingAnimationProps {
  lang?: Language
  stages?: { en: string; bn: string }[]
  icon?: ReactNode
  estimatedTime?: { en: string; bn: string }
}

const DEFAULT_STAGES: { en: string; bn: string }[] = [
  { en: '📡 Sending to Vision Engine...', bn: '📡 ভিশন ইঞ্জিনে পাঠানো হচ্ছে...' },
  { en: '🔬 Analyzing patterns...', bn: '🔬 প্যাটার্ন বিশ্লেষণ করা হচ্ছে...' },
  { en: '🧠 Generating report...', bn: '🧠 রিপোর্ট তৈরি হচ্ছে...' },
  { en: '✅ Almost done...', bn: '✅ প্রায় শেষ...' },
]

const DEFAULT_ESTIMATED = {
  en: 'Usually takes 10–15 seconds',
  bn: 'সাধারণত ১০–১৫ সেকেন্ড লাগে',
}

export function AnalyzingAnimation({
  lang: langProp,
  stages = DEFAULT_STAGES,
  icon,
  estimatedTime = DEFAULT_ESTIMATED,
}: AnalyzingAnimationProps) {
  const { lang: langCtx } = useLanguage()
  const lang = langProp ?? langCtx
  const [stageIndex, setStageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((i) => (i + 1) % stages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [stages.length])

  const stage = stages[stageIndex]

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
        {icon ? (
          <div className="relative mx-auto mb-7 flex h-28 w-28 items-center justify-center">
            <motion.div
              className="absolute h-28 w-28 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 opacity-20"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative z-10">{icon}</div>
          </div>
        ) : (
          <div className="relative mx-auto mb-7 flex h-28 w-28 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-sky-100 dark:border-sky-900/50" />
            <motion.div
              className="absolute h-20 w-20 rounded-full bg-gradient-to-br from-sky-400 to-sky-600"
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute h-9 w-9 rounded-full bg-gray-900 dark:bg-black"
              animate={{ scale: [1, 0.7, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute left-11 top-9 h-3 w-3 rounded-full bg-white/90"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        )}

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
          {lang === 'bn' ? estimatedTime.bn : estimatedTime.en}
        </p>
      </motion.div>
    </motion.div>
  )
}
