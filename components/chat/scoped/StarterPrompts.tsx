'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const INITIAL_VISIBLE = 4

interface StarterPromptsProps {
  prompts: string[]
  lang: 'bn' | 'en'
  disabled?: boolean
  onPick: (prompt: string) => void
}

/** Seeded questions: a few up front, the rest behind a "more" pill. */
export function StarterPrompts({ prompts, lang, disabled = false, onPick }: StarterPromptsProps) {
  const reduceMotion = useReducedMotion()
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? prompts : prompts.slice(0, INITIAL_VISIBLE)
  const hidden = prompts.length - INITIAL_VISIBLE

  return (
    <motion.div layout className="flex flex-wrap gap-2" role="list" aria-label={lang === 'bn' ? 'প্রস্তাবিত প্রশ্ন' : 'Suggested questions'}>
      <AnimatePresence initial={false}>
        {visible.map((prompt, i) => (
          <motion.button
            key={prompt}
            role="listitem"
            type="button"
            layout
            initial={reduceMotion ? false : { opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 460, damping: 32, delay: reduceMotion ? 0 : Math.min(i, 7) * 0.035 }}
            disabled={disabled}
            onClick={() => onPick(prompt)}
            className="rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-white hover:shadow-sm disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800"
            whileHover={reduceMotion || disabled ? undefined : { y: -2 }}
            whileTap={reduceMotion || disabled ? undefined : { scale: 0.97 }}
          >
            {prompt}
          </motion.button>
        ))}
      </AnimatePresence>

      {hidden > 0 && (
        <motion.button
          key="more"
          layout
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200'
          )}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
        >
          <Sparkles className="h-3 w-3" />
          {expanded
            ? lang === 'bn' ? 'কম দেখান' : 'Show fewer'
            : lang === 'bn' ? `আরও ${hidden} টি` : `${hidden} more ideas`}
          <ChevronDown className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')} />
        </motion.button>
      )}
    </motion.div>
  )
}
