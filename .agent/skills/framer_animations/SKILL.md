# Framer Motion — Professional Animation Patterns

## Setup Rule

NEVER animate ALL elements. Only animate:
1. Content entering the viewport for the first time
2. Status changes (loading → result, pending → critical)
3. User feedback (button press, error, success)
4. Numbers changing (calorie count, health score)

## Stagger Animation (for lists of results)

```typescript
// Parent container
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
}
// Each child
const item = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

<motion.div variants={container} initial="hidden" animate="show">
  {results.map(r => (
    <motion.div key={r.id} variants={item}>
      <ResultCard {...r} />
    </motion.div>
  ))}
</motion.div>
```

## Number Count-Up (for calorie totals, health scores)

```typescript
import { animate, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'

export function CountUp({ to, duration = 1.5 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)

  useEffect(() => {
    const controls = animate(motionValue, to, {
      duration,
      ease: 'easeOut',
      onUpdate(v) { if (ref.current) ref.current.textContent = Math.round(v).toLocaleString() }
    })
    return controls.stop
  }, [to, duration, motionValue])

  return <span ref={ref} className="tabular-nums">0</span>
}
```

## Severity Pulse (for critical medical alerts)

```typescript
// Only pulse for Critical and High — not for everything
export function SeverityPulse({ severity, children }: Props) {
  const shouldPulse = severity === 'Critical' || severity === 'High'
  return (
    <div className="relative inline-flex">
      {shouldPulse && (
        <motion.div
          className="absolute inset-0 rounded-full bg-red-400 opacity-75"
          animate={{ scale: [1, 1.4, 1], opacity: [0.75, 0, 0.75] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {children}
    </div>
  )
}
```

## Traffic Light Animation (GlycoVision risk)

```typescript
// Each circle: animate the active one
<motion.div
  animate={riskLevel === 'Red' ? { scale: [1, 1.08, 1] } : { scale: 1 }}
  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
  className={cn('w-12 h-12 rounded-full', riskLevel === 'Red' ? 'bg-red-500' : 'bg-red-200')}
/>
```

## AI Analysis Loading Animation

```typescript
export function AIAnalyzingOverlay({ stages }: { stages: string[] }) {
  const [stageIndex, setStageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex(i => (i + 1) % stages.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [stages.length])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center"
      >
        <div className="flex justify-center gap-1 mb-6">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-sky-500"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={stageIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-sm text-gray-600 font-medium"
          >
            {stages[stageIndex]}
          </motion.p>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
```

## DO NOT Use These

- `animate={{ rotate: 360 }}` — spinner alternatives use CSS instead
- `whileHover={{ scale: 1.05 }}` on large cards — feels wobbly
- Layout animations on every list item — causes jank
- `transition={{ type: 'spring', stiffness: 50 }}` — too slow and bouncy