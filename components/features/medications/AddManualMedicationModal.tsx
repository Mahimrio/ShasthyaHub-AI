'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSaveMedicationSchedule } from '@/hooks/useMedicationReminders'
import { Clock, Pill, Plus, Utensils } from 'lucide-react'
import type { MealTimingType, SlotType } from '@/types'

interface AddManualMedicationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddManualMedicationModal({
  open,
  onOpenChange,
}: AddManualMedicationModalProps) {
  const { lang } = useLanguage()
  const isBn = lang === 'bn'
  const saveMedication = useSaveMedicationSchedule()

  const [drugNameEn, setDrugNameEn] = useState('')
  const [drugNameBn, setDrugNameBn] = useState('')
  const [dosage, setDosage] = useState('1 Tablet')
  const [mealTiming, setMealTiming] = useState<MealTimingType>('after_meal')
  const [scheduledTime, setScheduledTime] = useState('08:00')
  const [slotType, setSlotType] = useState<SlotType>('morning')
  const [durationDays, setDurationDays] = useState('7')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!drugNameEn.trim()) return

    await saveMedication.mutateAsync({
      drug_name_en: drugNameEn.trim(),
      drug_name_bn: drugNameBn.trim() || drugNameEn.trim(),
      dosage: dosage.trim() || '1 unit',
      meal_timing: mealTiming,
      scheduled_time: scheduledTime,
      slot_type: slotType,
      duration_days: parseInt(durationDays, 10) || 7,
      start_date: new Date().toISOString().split('T')[0],
      is_active: true,
    })

    // Reset & close
    setDrugNameEn('')
    setDrugNameBn('')
    setDosage('1 Tablet')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white shadow-sm">
              <Pill className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
              {isBn ? 'নতুন ঔষধ রিমাইন্ডার যোগ করুন' : 'Add Medication Reminder'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            {isBn
              ? 'ঔষধের নাম ও সময়সূচি নির্ধারণ করুন — নির্দিষ্ট সময়ে অ্যালার্ম ও সতর্কতা পাবেন।'
              : 'Set dosage and exact daily alarm timing for your medication.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Drug Name Fields */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {isBn ? 'ঔষধের নাম (ইংরেজি)' : 'Medication Name (English)'}
            </Label>
            <Input
              required
              placeholder="e.g. Napa Extra 500mg, Seclo 20mg"
              value={drugNameEn}
              onChange={(e) => setDrugNameEn(e.target.value)}
              className="rounded-xl border-gray-200 dark:border-gray-700 text-xs h-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {isBn ? 'বাংলা নাম (ঐচ্ছিক)' : 'Bangla Name (Optional)'}
              </Label>
              <Input
                placeholder="যেমন: নাপা এক্সট্রা"
                value={drugNameBn}
                onChange={(e) => setDrugNameBn(e.target.value)}
                className="rounded-xl border-gray-200 dark:border-gray-700 text-xs h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {isBn ? 'ডোজ / পরিমাণ' : 'Dosage'}
              </Label>
              <Input
                placeholder="e.g. 1 Tablet, 500mg"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="rounded-xl border-gray-200 dark:border-gray-700 text-xs h-10"
              />
            </div>
          </div>

          {/* Time & Slot Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-sky-500" />
                <span>{isBn ? 'গ্রহণের সময়' : 'Dose Time'}</span>
              </Label>
              <Input
                type="time"
                required
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="rounded-xl border-gray-200 dark:border-gray-700 text-xs h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {isBn ? 'দিনের বেলা' : 'Time Slot'}
              </Label>
              <select
                value={slotType}
                onChange={(e) => setSlotType(e.target.value as SlotType)}
                className="w-full h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="morning">{isBn ? 'সকাল (Morning)' : 'Morning'}</option>
                <option value="afternoon">{isBn ? 'দুপুর (Afternoon)' : 'Afternoon'}</option>
                <option value="evening">{isBn ? 'সন্ধ্যা (Evening)' : 'Evening'}</option>
                <option value="night">{isBn ? 'রাত (Night)' : 'Night'}</option>
                <option value="custom">{isBn ? 'কাস্টম (Custom)' : 'Custom'}</option>
              </select>
            </div>
          </div>

          {/* Meal Timing */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Utensils className="h-3.5 w-3.5 text-teal-500" />
              <span>{isBn ? 'খাবারের নিয়ম' : 'Meal Relation'}</span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'before_meal', en: 'Before Meal', bn: 'খাবার আগে' },
                { key: 'after_meal', en: 'After Meal', bn: 'খাবার পর' },
                { key: 'empty_stomach', en: 'Empty Stomach', bn: 'খালি পেটে' },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMealTiming(m.key as MealTimingType)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    mealTiming === m.key
                      ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-600 dark:text-sky-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {isBn ? m.bn : m.en}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Days */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {isBn ? 'কোর্সের মেয়াদ (দিন)' : 'Duration (Days)'}
            </Label>
            <Input
              type="number"
              min="1"
              max="365"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="rounded-xl border-gray-200 dark:border-gray-700 text-xs h-10"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={saveMedication.isPending || !drugNameEn.trim()}
              className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-bold h-11 text-xs shadow-md"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span>{isBn ? 'রিমাইন্ডার সেভ করুন' : 'Save Reminder'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
