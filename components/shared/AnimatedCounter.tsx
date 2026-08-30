'use client'

import { useEffect, useRef } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  /** Seconds. */
  duration?: number
  decimals?: number
  className?: string
}

/** Count-up number. Renders the final value for SSR/reduced-motion, animates 0→value on mount. */
export function AnimatedCounter({
  value,
  duration = 1.2,
  decimals = 0,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduceMotion) {
      el.textContent = value.toFixed(decimals)
      return
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = v.toFixed(decimals)
      },
    })
    return () => controls.stop()
  }, [value, duration, decimals, reduceMotion])

  return (
    <span ref={ref} className={className}>
      {value.toFixed(decimals)}
    </span>
  )
}
