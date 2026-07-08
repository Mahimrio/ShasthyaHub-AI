'use client'

import { cn } from '@/lib/utils'

interface LikertScaleProps {
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
}

const OPTIONS = [
  { value: 1, labelEn: 'Strongly Disagree', labelBn: 'একদমই না' },
  { value: 2, labelEn: 'Disagree', labelBn: 'না' },
  { value: 3, labelEn: 'Neutral', labelBn: 'মাঝামাঝি' },
  { value: 4, labelEn: 'Agree', labelBn: 'হ্যাঁ' },
  { value: 5, labelEn: 'Strongly Agree', labelBn: 'অবশ্যই হ্যাঁ' },
]

const STATE_COLORS = [
  'from-red-500 to-red-400',
  'from-orange-400 to-amber-400',
  'from-yellow-400 to-amber-300',
  'from-lime-400 to-green-400',
  'from-emerald-500 to-green-500',
]

export function LikertScale({ value, onChange, disabled }: LikertScaleProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center" role="radiogroup" aria-label="Response scale">
      {OPTIONS.map((opt, i) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            role="radio"
            aria-checked={selected}
            className={cn(
              'flex flex-col items-center gap-1 min-w-[64px] px-3 py-3 rounded-xl border-2 text-xs font-medium transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
              selected
                ? `bg-gradient-to-b ${STATE_COLORS[i]} text-white border-transparent shadow-lg scale-105`
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="text-lg font-bold leading-none">{opt.value}</span>
            <span className="text-[10px] leading-tight text-center whitespace-nowrap">
              {opt.labelBn}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function LikertScaleCompact({ value, onChange, disabled }: LikertScaleProps) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Response scale">
      {OPTIONS.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            role="radio"
            aria-checked={selected}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-lg border text-[10px] font-medium transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
              selected
                ? `bg-gradient-to-b ${STATE_COLORS[opt.value - 1]} text-white border-transparent shadow-md scale-105`
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="text-xs font-bold">{opt.value}</span>
            <span className="leading-tight text-center">{opt.labelBn}</span>
          </button>
        )
      })}
    </div>
  )
}
