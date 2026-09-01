'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  CalendarClock,
  Info,
  Moon,
  Printer,
  Settings2,
  Sunset,
  Sun,
  Sunrise,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useReminderSettings } from '@/hooks/useMedicationReminders'
import { MedicationSettingsModal } from '@/components/features/medications/MedicationSettingsModal'
import { SaveToCabinetModal } from '@/components/features/scriptguard/SaveToCabinetModal'
import { formatTimeDisplay, resolveSlotTimes } from '@/lib/services/medication-reminder'
import type {
  ExtractedMedication,
  Language,
  MedicationSchedule,
  ScheduleSlot,
} from '@/types'

interface MedicationScheduleTimelineProps {
  schedule: Pick<MedicationSchedule, 'morning' | 'afternoon' | 'evening' | 'night'>
  durationDays: number
  specialInstructions: string[]
  lang: Language
  prescriptionId?: string
  extractedDrugs?: ExtractedMedication[]
  onSwitchToCabinet?: () => void
}

type SlotKey = keyof Pick<
  MedicationSchedule,
  'morning' | 'afternoon' | 'evening' | 'night'
>

interface SlotMeta {
  key: SlotKey
  icon: typeof Sun
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
  slotTime,
  lang,
}: {
  meta: SlotMeta
  slots: ScheduleSlot[]
  slotTime: string
  lang: Language
}) {
  const Icon = meta.icon
  const label = lang === 'bn' ? meta.label.bn : meta.label.en
  const timeHint = lang === 'bn' ? meta.timeHint.bn : meta.timeHint.en
  const formattedTime = formatTimeDisplay(slotTime, lang)

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xs print:break-inside-avoid print:border-gray-300">
      <div
        className={`flex items-center justify-between bg-gradient-to-r px-4 py-3 ${meta.headerBg}`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${meta.iconColor}`} />
          <div>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
              {label}
            </span>
            <span className="ml-2 text-[11px] font-mono font-bold text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-black/30 px-2 py-0.5 rounded-md">
              {formattedTime}
            </span>
          </div>
        </div>
        <Badge variant="outline" className="text-[11px] font-semibold">
          {slots.length} {lang === 'bn' ? 'ওষুধ' : slots.length === 1 ? 'drug' : 'drugs'}
        </Badge>
      </div>

      <div className="space-y-2 p-3.5">
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
                className={`rounded-2xl px-3.5 py-2.5 text-xs font-medium border border-black/5 dark:border-white/5 ${drugChipColor(
                  name
                )}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{name}</span>
                  {slot.dosage && (
                    <span className="text-xs opacity-80 font-mono font-semibold">
                      {slot.dosage}
                    </span>
                  )}
                </div>
                {instruction && (
                  <span className="block text-[11px] font-normal opacity-90 mt-0.5">
                    {instruction}
                  </span>
                )}
              </div>
            )
          })
        )}
        {slots.length > 0 && (
          <p className="pt-1 text-center text-[11px] text-gray-400 dark:text-gray-500">
            ⏰ {timeHint} ({formattedTime})
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
  prescriptionId,
  extractedDrugs,
  onSwitchToCabinet,
}: MedicationScheduleTimelineProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { data: reminderSettings } = useReminderSettings()

  const defaultTimes = resolveSlotTimes(
    reminderSettings || {
      user_id: 'default',
      breakfast_time: '08:00',
      lunch_time: '13:30',
      dinner_time: '21:30',
      bedtime: '22:30',
      notifications_enabled: true,
      sound_enabled: true,
      notify_caregivers_on_missed: true,
      grace_period_minutes: 45,
    }
  )

  const [saveToCabinetModalOpen, setSaveToCabinetModalOpen] = useState(false)

  const derivedDrugs: ExtractedMedication[] = extractedDrugs || Array.from(
    new Map(
      [
        ...schedule.morning,
        ...schedule.afternoon,
        ...schedule.evening,
        ...schedule.night,
      ].map((s) => [
        s.drug_bn || s.drug_en,
        {
          written_text: s.drug_bn || s.drug_en,
          brand_name: s.drug_bn || s.drug_en,
          generic_name: s.drug_en || s.drug_bn,
          dosage: s.dosage || '1 unit',
          drug_class: 'Prescribed Agent',
          frequency: '1+0+1',
          duration: `${durationDays} days`,
          instructions: s.instructions_bn || s.instructions_en || 'ডাক্তারের পরামর্শমতো সেব্য',
          mapping_confidence: 'high' as const,
        },
      ])
    ).values()
  )

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
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 print:hidden">
        <Badge
          variant="outline"
          className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold"
        >
          <CalendarClock className="mr-1.5 h-3.5 w-3.5 text-sky-500" />
          {lang === 'bn'
            ? `${durationDays > 0 ? durationDays : 7} দিনের সম্পূর্ণ কোর্স`
            : `${durationDays > 0 ? durationDays : 7}-day total course`}
        </Badge>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Settings button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="rounded-xl text-xs font-semibold h-8"
          >
            <Settings2 className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
            <span>{lang === 'bn' ? 'খাবারের সময়' : 'Meal Routine'}</span>
          </Button>

          {/* User-Controlled Save to Cabinet Button */}
          <Button
            size="sm"
            onClick={() => setSaveToCabinetModalOpen(true)}
            className="rounded-xl text-xs font-bold h-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm"
          >
            <Bell className="mr-1.5 h-3.5 w-3.5" />
            <span>
              {lang === 'bn'
                ? 'ঔষধ তালিকায় সংরক্ষণ ও রিমাইন্ডার'
                : 'Save to Cabinet & Reminders'}
            </span>
          </Button>

          {/* Print button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            className="rounded-xl text-xs h-8 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            <span>{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
          </Button>
        </div>
      </div>

      {/* 2x2 grid on desktop, stack on mobile. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SLOTS.map((meta) => (
          <SlotCard
            key={meta.key}
            meta={meta}
            slots={schedule[meta.key]}
            slotTime={defaultTimes[meta.key] || '08:00'}
            lang={lang}
          />
        ))}
      </div>

      {/* Special instructions callout */}
      {hasInstructions && (
        <div className="rounded-2xl border border-sky-200/70 bg-sky-50/70 p-4 dark:border-sky-900/50 dark:bg-sky-900/20 print:break-inside-avoid shadow-2xs">
          <div className="mb-2 flex items-center gap-2">
            <Info className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <h4 className="text-sm font-bold text-sky-900 dark:text-sky-200">
              {lang === 'bn' ? 'বিশেষ সতর্কতা ও নির্দেশনা' : 'Special Instructions'}
            </h4>
          </div>
          <ul className="space-y-1.5">
            {specialInstructions.map((instr, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-sky-950 dark:text-sky-200 font-medium"
              >
                <span className="mt-0.5 text-sky-500 font-bold">•</span>
                <span>{instr}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <MedicationSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      <SaveToCabinetModal
        open={saveToCabinetModalOpen}
        onOpenChange={setSaveToCabinetModalOpen}
        drugs={derivedDrugs}
        schedule={schedule}
        durationDays={durationDays}
        prescriptionId={prescriptionId}
        onSwitchToCabinet={onSwitchToCabinet}
      />
    </motion.div>
  )
}
