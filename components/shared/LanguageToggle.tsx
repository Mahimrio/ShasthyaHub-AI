'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

export function LanguageToggle() {
  const { lang, setLang } = useLanguage()
  const reduceMotion = useReducedMotion()

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex w-28 shrink-0 items-center p-1 rounded-full bg-gray-100/90 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 shadow-xs"
    >
      <div className="relative isolate grid h-7 w-full grid-cols-2">
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ x: lang === 'bn' ? '0%' : '100%' }}
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36, mass: 0.75 }}
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 shadow-sm"
        />
        <button
          type="button"
          lang="bn"
          aria-pressed={lang === 'bn'}
          onClick={() => setLang('bn')}
          className={cn(
            'relative z-10 flex h-7 min-w-0 items-center justify-center rounded-full font-bengali text-xs font-[600] leading-none tracking-normal transition-colors duration-200 motion-reduce:transition-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
            lang === 'bn'
              ? 'text-white'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          বাংলা
        </button>
        <button
          type="button"
          lang="en"
          aria-pressed={lang === 'en'}
          onClick={() => setLang('en')}
          className={cn(
            'relative z-10 flex h-7 min-w-0 items-center justify-center rounded-full font-sans text-xs font-[600] leading-none tracking-normal transition-colors duration-200 motion-reduce:transition-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
            lang === 'en'
              ? 'text-white'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          EN
        </button>
      </div>
    </div>
  )
}
