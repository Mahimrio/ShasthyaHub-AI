'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * Soft crossfade on every dashboard route change.
 * Opacity-only: pages animate their own y-entrance, so adding a translate
 * here doubles the motion and makes navigation feel jumpy.
 */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
