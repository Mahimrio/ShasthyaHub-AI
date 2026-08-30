'use client'

import { motion, useReducedMotion } from 'framer-motion'

/** Success check that draws itself in (circle sweep, then tick). */
export function AnimatedCheck({
  className = 'h-5 w-5 text-green-600 dark:text-green-400',
}: {
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        initial={reduceMotion ? false : { pathLength: 0, rotate: -90 }}
        animate={{ pathLength: 1, rotate: -90 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ transformOrigin: '50% 50%' }}
      />
      <motion.path
        d="M7.5 12.5l3 3 6-6.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduceMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: 0.35, ease: 'easeOut' }}
      />
    </svg>
  )
}
