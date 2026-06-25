'use client'

import { motion } from 'framer-motion'
import {
  CalendarClock,
  Info,
  Moon,
  Printer,
  Sunset,
  Sun,
  Sunrise,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type {
  Language,
  MedicationSchedule,
  ScheduleSlot,
} from '@/types'

interface MedicationScheduleTimelineProps {
  schedule: Pick<MedicationSchedule, 'morning' | 'afternoon' | 'evening' | 'night'>
  durationDays: number
  specialInstructions: string[]
  lang: Language
}

type SlotKey = keyof Pick<
  MedicationSchedule,
  'morning' | 'afternoon' | 'evening' | 'night'
>

interface SlotMeta {
  key: SlotKey
  icon: typeof Sun
  /** Tailwind gradient classes for the card header. */
  headerBg: string
  iconColor: string
  label: { en: string; bn: string }
  timeHint: { en: string; bn: string }
}

const SLOTS: SlotMeta[] = [
  {
    key: 'morning',
    icon: Sunrise,
    headerBg: 'from-amber-100 to-yellow-50 dark:from-amber-900/40 dark:to-yellow-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    label: { en: 'Morning', bn: 'সকাল' },
    timeHint: { en: 'after breakfast', bn: 'সকালের নাস্তার পর' },
  },
  {
    key: 'afternoon',
    icon: Sun,
    headerBg: 'from-orange-100 to-amber-50 dark:from-orange-900/40 dark:to-amber-900/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
    label: { en: 'Afternoon', bn: 'দুপুর' },
    timeHint: { en: 'after lunch', bn: 'দুপুরের খাবারের পর' },
  },
  {
    key: 'evening',
    icon: Sunset,
    headerBg: 'from-violet-100 to-purple-50 dark:from-violet-900/40 dark:to-purple-900/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
    label: { en: 'Evening', bn: 'সন্ধ্যা' },
    timeHint: { en: 'after snack', bn: 'বিকেলের নাস্তার পর' },
  },
  {
    key: 'night',
    icon: Moon,
    headerBg: 'from-indigo-100 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    label: { en: 'Night', bn: 'রাত' },
    timeHint: { en: 'before sleep', bn: 'ঘুমানোর আগে' },
  },
]

/**
 * Deterministic pastel color for a drug based on the first char of its name.
 * Keeps the same drug the same color across slots without needing DB data.
 */
function drugChipColor(name: string): string {
  const palette = [
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
    'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
    'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
    'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  ]
  const code = name.charCodeAt(0) || 0
  return palette[code % palette.length]
}

function SlotCard({
  meta,
  slots,
  lang,
}: {
  meta: SlotMeta
  slots: ScheduleSlot[]
  lang: Language
}) {
  const Icon = meta.icon
  const label = lang === 'bn' ? meta.label.bn : meta.label.en
  const timeHint = lang === 'bn' ? meta.timeHint.bn : meta.timeHint.en

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 print:break-inside-avoid print:border-gray-300">
      <div
        className={`flex items-center justify-between bg-gradient-to-r px-4 py-3 ${meta.headerBg}`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${meta.iconColor}`} />
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
            {label}
          </span>
        </div>
        <Badge variant="outline" className="text-[11px]">
          {slots.length} {lang === 'bn' ? 'ওষুধ' : 'drugs'}
        </Badge>
      </div>

      <div className="space-y-2 p-3">
        {slots.length === 0 ? (
          <p className="py-2 text-center text-xs text-gray-400 dark:text-gray-500">
            {lang === 'bn' ? 'এই সময়ে কোনো ওষুধ নেই' : 'No medication'}
          </p>
        ) : (
          slots.map((slot, i) => {
            const name = lang === 'bn' ? slot.drug_bn : slot.drug_en
            const instruction =
              lang === 'bn' ? slot.instructions_bn : slot.instructions_en
            return (
              <div
                key={`${name}-${i}`}
                className={`rounded-full px-3 py-2 text-sm font-medium ${drugChipColor(name)}`}
              >
                <span className="font-semibold">{name}</span>
                {slot.dosage && (
                  <span className="ml-1 opacity-75">· {slot.dosage}</span>
                )}
                {instruction && (
                  <span className="block text-[11px] font-normal opacity-80">
                    {instruction}
                  </span>
                )}
              </div>
            )
          })
        )}
        {slots.length > 0 && (
          <p className="pt-1 text-center text-[11px] text-gray-400 dark:text-gray-500">
            ⏰ {timeHint}
          </p>
        )}
      </div>
    </div>
  )
}

export default function MedicationScheduleTimeline({
  schedule,
  durationDays,
  specialInstructions,
  lang,
}: MedicationScheduleTimelineProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  const hasInstructions = specialInstructions.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between print:hidden">
        <Badge
          variant="outline"
          className="border-gray-200 text-gray-600 dark:border-gray-600 dark:text-gray-300"
        >
          <CalendarClock className="mr-1 h-3.5 w-3.5" />
          {lang === 'bn'
            ? `${durationDays} দিনের কোর্স`
            : `${durationDays}-day course`}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="rounded-lg print:hidden"
        >
          <Printer className="mr-1.5 h-3.5 w-3.5" />
          {lang === 'bn' ? 'প্রিন্ট' : 'Print'}
        </Button>
      </div>

      {/* 2x2 grid on desktop, stack on mobile. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SLOTS.map((meta) => (
          <SlotCard
            key={meta.key}
            meta={meta}
            slots={schedule[meta.key]}
            lang={lang}
          />
        ))}
      </div>

      {/* Special instructions callout */}
      {hasInstructions && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900/50 dark:bg-sky-900/20 print:break-inside-avoid">
          <div className="mb-2 flex items-center gap-2">
            <Info className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <h4 className="text-sm font-semibold text-sky-800 dark:text-sky-200">
              {lang === 'bn' ? 'বিশেষ নির্দেশনা' : 'Special Instructions'}
            </h4>
          </div>
          <ul className="space-y-1.5">
            {specialInstructions.map((instr, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-sky-800 dark:text-sky-200"
              >
                <span className="mt-0.5 text-sky-500">•</span>
                <span>{instr}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
