'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  HelpCircle,
  Pill,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  useMedicationDoses,
  useRecordDoseAction,
} from '@/hooks/useMedicationReminders'
import { MissedDoseAlertModal } from '@/components/features/medications/MissedDoseAlertModal'
import type { ActiveDoseWithStatus } from '@/types'

export function TodayMedicationStrip() {
  const { lang } = useLanguage()
  const isBn = lang === 'bn'

  const { data: dosesData } = useMedicationDoses()
  const recordAction = useRecordDoseAction()
  const [selectedMissedDose, setSelectedMissedDose] = useState<ActiveDoseWithStatus | null>(null)

  const doses = dosesData?.doses || []

  // If no doses at all, don't display
  if (doses.length === 0) return null

  // Find due now dose or next upcoming dose
  const dueDose = doses.find((d) => d.isDueNow && d.status !== 'taken')
  const missedDose = doses.find((d) => d.isMissed && d.status !== 'taken')
  const nextDose = dueDose || missedDose || doses.find((d) => d.status === 'pending')

  if (!nextDose) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 sm:p-5 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
                dueDose
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 animate-pulse'
                  : missedDose
                  ? 'bg-gradient-to-br from-red-500 to-rose-500'
                  : 'bg-gradient-to-br from-sky-500 to-teal-500'
              }`}
            >
              <Pill className="h-5 w-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    dueDose
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                      : missedDose
                      ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                      : 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                  }`}
                >
                  {dueDose
                    ? isBn
                      ? 'এখনই গ্রহণের সময়'
                      : 'Due Now'
                    : missedDose
                    ? isBn
                      ? 'দেরি হয়েছে'
                      : 'Missed Dose'
                    : isBn
                    ? 'পরবর্তী ঔষধ'
                    : 'Next Medication'}
                </span>

                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {nextDose.dueTime}
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
                {isBn ? nextDose.schedule.drug_name_bn : nextDose.schedule.drug_name_en}{' '}
                <span className="text-xs font-semibold text-gray-500 font-mono">
                  ({nextDose.schedule.dosage})
                </span>
              </h4>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {nextDose.schedule.meal_timing === 'before_meal'
                  ? isBn
                    ? 'খাবার ৩০ মিনিট আগে সেব্য'
                    : 'Take 30 mins before meal'
                  : isBn
                  ? 'খাবারের পর সেব্য'
                  : 'Take after meal'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {missedDose && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedMissedDose(missedDose)}
                className="rounded-xl border-red-200 text-red-600 text-xs font-bold h-9 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/40"
              >
                <HelpCircle className="h-3.5 w-3.5 mr-1" />
                <span>{isBn ? 'সতর্কবার্তা' : 'Advice'}</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={() =>
                recordAction.mutate({
                  schedule_id: nextDose.schedule.id,
                  status: 'taken',
                  scheduled_time: nextDose.schedule.scheduled_time,
                })
              }
              disabled={recordAction.isPending}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold h-9 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              <span>{isBn ? 'খেয়েছি (Mark Taken)' : 'Mark Taken'}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                recordAction.mutate({
                  schedule_id: nextDose.schedule.id,
                  status: 'snoozed',
                  snooze_minutes: 15,
                })
              }
              disabled={recordAction.isPending}
              className="rounded-xl border-gray-200 dark:border-gray-700 text-xs font-semibold h-9 hover:bg-gray-50"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1 text-gray-500" />
              <span>{isBn ? '১৫ মি:' : '15m'}</span>
            </Button>
          </div>
        </div>
      </motion.div>

      <MissedDoseAlertModal
        dose={selectedMissedDose}
        open={!!selectedMissedDose}
        onOpenChange={(open) => !open && setSelectedMissedDose(null)}
      />
    </>
  )
}
