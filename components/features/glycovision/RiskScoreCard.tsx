'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Language, RiskLevel } from '@/types'

interface RiskScoreCardProps {
  riskLevel: RiskLevel
  glycemicLoad: number
  summaryEn: string
  summaryBn: string
  lang: Language
}

interface RiskConfig {
  border: string
  bg: string
  dot: string
  text: string
  icon: typeof AlertTriangle
  gradient: string
  labelEn: string
  labelBn: string
}

const config: Record<RiskLevel, RiskConfig> = {
  Green: {
    border: 'border-green-200 dark:border-green-800',
    bg: 'bg-green-50 dark:bg-green-950/40',
    dot: 'bg-green-500',
    text: 'text-green-700 dark:text-green-300',
    icon: CheckCircle,
    gradient: 'from-green-400 to-emerald-500',
    labelEn: 'Low Impact',
    labelBn: 'কম প্রভাব',
  },
  Yellow: {
    border: 'border-yellow-200 dark:border-yellow-800',
    bg: 'bg-yellow-50 dark:bg-yellow-950/40',
    dot: 'bg-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-300',
    icon: Info,
    gradient: 'from-yellow-400 to-orange-500',
    labelEn: 'Moderate Impact',
    labelBn: 'মাঝারি প্রভাব',
  },
  Red: {
    border: 'border-red-200 dark:border-red-800',
    bg: 'bg-red-50 dark:bg-red-950/40',
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-300',
    icon: AlertTriangle,
    gradient: 'from-red-500 to-rose-600',
    labelEn: 'High Impact',
    labelBn: 'উচ্চ প্রভাব',
  },
}

function TrafficLightIndicator({ riskLevel }: { riskLevel: RiskLevel }) {
  const levels: RiskLevel[] = ['Green', 'Yellow', 'Red']
  const [activeIndex, setActiveIndex] = useState(0)
  const currentIndex = levels.indexOf(riskLevel)

  useEffect(() => {
    if (activeIndex < currentIndex) {
      const timer = setTimeout(() => setActiveIndex((i) => i + 1), 400)
      return () => clearTimeout(timer)
    }
  }, [activeIndex, currentIndex])

  return (
    <div className="flex items-center gap-2">
      {levels.map((level, i) => (
        <div key={level} className="flex flex-col items-center gap-1">
          <motion.div
            animate={{
              scale: i <= activeIndex ? [1, 1.25, 1] : 1,
              opacity: i <= activeIndex ? 1 : 0.25,
            }}
            transition={{ duration: 0.5, delay: i * 0.4 }}
            className={cn(
              'h-4 w-4 rounded-full shadow-sm',
              level === 'Green' && 'bg-green-500',
              level === 'Yellow' && 'bg-yellow-500',
              level === 'Red' && 'bg-red-500'
            )}
          />
        </div>
      ))}
    </div>
  )
}

function GaugeBar({ riskLevel }: { riskLevel: RiskLevel }) {
  const [width, setWidth] = useState(0)
  const targetWidth = riskLevel === 'Green' ? 20 : riskLevel === 'Yellow' ? 55 : 95

  useEffect(() => {
    const timer = setTimeout(() => setWidth(targetWidth), 300)
    return () => clearTimeout(timer)
  }, [targetWidth])

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
      <motion.div
        animate={{ width: `${width}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={cn(
          'h-full rounded-full bg-gradient-to-r',
          config[riskLevel].gradient
        )}
      />
    </div>
  )
}

export default function RiskScoreCard({
  riskLevel,
  glycemicLoad,
  summaryEn,
  summaryBn,
  lang,
}: RiskScoreCardProps) {
  const cfg = config[riskLevel]
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('rounded-2xl border p-5', cfg.border, cfg.bg)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <Icon className={cn('h-6 w-6', cfg.text)} />
          </motion.div>
          <div>
            <p className={cn('text-sm font-bold', cfg.text)}>
              {lang === 'bn' ? cfg.labelBn : cfg.labelEn}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {lang === 'bn' ? 'গ্লাইসেমিক লোড:' : 'Glycemic Load:'} {glycemicLoad}
            </p>
          </div>
        </div>
        <TrafficLightIndicator riskLevel={riskLevel} />
      </div>

      {/* Animated gauge */}
      <div className="mt-4">
        <GaugeBar riskLevel={riskLevel} />
      </div>

      {/* Summary */}
      <p className={cn('mt-3 text-sm leading-relaxed', cfg.text)}>
        {lang === 'bn' ? summaryBn : summaryEn}
      </p>
    </motion.div>
  )
}
