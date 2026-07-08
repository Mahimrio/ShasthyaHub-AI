'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'

interface QuestionProgressProps {
  current: number
  total: number
}

export function QuestionProgress({ current, total }: QuestionProgressProps) {
  const { lang } = useLanguage()
  const pct = Math.round((current / total) * 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-500 dark:text-gray-400">
          {lang === 'bn'
            ? `প্রশ্ন ${current} / ${total}`
            : `Question ${current} of ${total}`}
        </span>
        <span className="text-gray-400 dark:text-gray-500 tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
