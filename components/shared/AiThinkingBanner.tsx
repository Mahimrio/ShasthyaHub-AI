'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Microscope, Brain, CheckCircle2, type LucideIcon } from 'lucide-react'

const stages: { text: string; icon: LucideIcon }[] = [
  { text: 'সার্ভারে পাঠানো হচ্ছে... / Sending to Vision Engine...', icon: Send },
  { text: 'AI বিশ্লেষণ করছে... / Analyzing patterns...', icon: Microscope },
  { text: 'রিপোর্ট তৈরি হচ্ছে... / Generating report...', icon: Brain },
  { text: 'প্রায় শেষ... / Almost done...', icon: CheckCircle2 },
]

export function AiThinkingBanner() {
  const [stageIndex, setStageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((i) => (i + 1) % stages.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="rounded-xl bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800 p-4 flex items-center gap-4">
      <div className="flex gap-1 shrink-0">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
          />
        ))}
      </div>
      <div className="flex-1 min-h-[20px]">
        <AnimatePresence mode="wait">
          <motion.p
            key={stageIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 text-sm text-sky-700 dark:text-sky-300 font-medium"
          >
            {(() => { const StageIcon = stages[stageIndex].icon; return <StageIcon className="h-4 w-4 shrink-0" /> })()}
            {stages[stageIndex].text}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
