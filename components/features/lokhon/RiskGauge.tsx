'use client'

import type { RiskBand } from '@/types'

interface RiskGaugeProps {
  percentage: number
  band: RiskBand
  size?: number
  lang: 'en' | 'bn'
}

const BAND_CONFIG: Record<RiskBand, { color: string; track: string; labelEn: string; labelBn: string }> = {
  Low: {
    color: '#22c55e',
    track: '#dcfce7',
    labelEn: 'Low Risk',
    labelBn: 'কম ঝুঁকি',
  },
  Moderate: {
    color: '#f59e0b',
    track: '#fef3c7',
    labelEn: 'Moderate Risk',
    labelBn: 'মাঝারি ঝুঁকি',
  },
  High: {
    color: '#ef4444',
    track: '#fee2e2',
    labelEn: 'High Risk',
    labelBn: 'উচ্চ ঝুঁকি',
  },
  Urgent: {
    color: '#dc2626',
    track: '#fecaca',
    labelEn: 'Urgent — Seek Care',
    labelBn: 'জরুরি — চিকিৎসা নিন',
  },
}

export function RiskGauge({ percentage, band, size = 200, lang }: RiskGaugeProps) {
  const config = BAND_CONFIG[band]
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={config.track}
          strokeWidth={14}
          className="dark:opacity-30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={config.color}
          strokeWidth={14}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span
          className="text-4xl font-black tabular-nums"
          style={{ color: config.color }}
        >
          {Math.round(percentage)}%
        </span>
      </div>
      <div
        className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-md"
        style={{ backgroundColor: config.color }}
      >
        {lang === 'bn' ? config.labelBn : config.labelEn}
      </div>
    </div>
  )
}
