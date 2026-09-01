'use client'

import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Pill,
  SkipForward,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRecordDoseAction } from '@/hooks/useMedicationReminders'
import type { ActiveDoseWithStatus } from '@/types'

interface MissedDoseAlertModalProps {
  dose: ActiveDoseWithStatus | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MissedDoseAlertModal({
  dose,
  open,
  onOpenChange,
}: MissedDoseAlertModalProps) {
  const { lang } = useLanguage()
  const recordAction = useRecordDoseAction()

  if (!dose) return null

  const advice = dose.clinicalMissedAdvice
  const isBn = lang === 'bn'

  const handleTakeLate = async () => {
    await recordAction.mutateAsync({
      schedule_id: dose.schedule.id,
      status: 'taken',
      scheduled_time: dose.schedule.scheduled_time,
      notes: 'Logged late after reminder',
    })
    onOpenChange(false)
  }

  const handleSkip = async () => {
    await recordAction.mutateAsync({
      schedule_id: dose.schedule.id,
      status: 'skipped',
      scheduled_time: dose.schedule.scheduled_time,
      notes: 'Skipped due to delay',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border border-red-200/80 dark:border-red-900/50 bg-white dark:bg-gray-900 shadow-2xl">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white">
                {isBn ? 'ঔষধ গ্রহণের সময় মিস হয়েছে' : 'Missed Medication Dose'}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/90 mt-0.5">
                {isBn
                  ? `নির্ধারিত সময় ছিল: ${dose.dueTime}`
                  : `Scheduled time was: ${dose.dueTime}`}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Drug Card */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Pill className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {isBn ? dose.schedule.drug_name_bn : dose.schedule.drug_name_en}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {dose.schedule.dosage} • {dose.schedule.drug_name_en}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/80 px-2.5 py-1 rounded-full border border-red-200/60 dark:border-red-900/60">
              {isBn ? 'দেরি হয়েছে' : 'Delayed'}
            </span>
          </div>

          {/* Clinical Advice Box */}
          {advice && (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                <HelpCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {isBn ? 'চিকিৎসকের নিরাপত্তা পরামর্শ' : 'Clinical Safety Advisory'}
                </span>
              </div>
              <p className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed font-medium">
                {isBn ? advice.advice_bn : advice.advice_en}
              </p>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 italic">
                {isBn ? `কারণ: ${advice.reason_bn}` : `Reason: ${advice.reason_en}`}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <Button
              onClick={handleTakeLate}
              disabled={recordAction.isPending}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold h-11 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              <span>{isBn ? 'এখনই খেয়েছি' : 'Take Now (Late)'}</span>
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              disabled={recordAction.isPending}
              className="rounded-2xl border-gray-200 dark:border-gray-700 text-xs font-bold h-11 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <SkipForward className="h-4 w-4 mr-1.5 text-gray-500" />
              <span>{isBn ? 'এবার বাদ দিন' : 'Skip This Dose'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
