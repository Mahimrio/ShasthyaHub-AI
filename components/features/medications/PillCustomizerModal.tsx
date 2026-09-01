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
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'
import { PillAvatar, getPillDescriptor } from '@/components/shared/PillAvatar'
import { useSaveMedicationSchedule } from '@/hooks/useMedicationReminders'
import { Palette, Sparkles, Check } from 'lucide-react'
import type { PillShapeType, MedicationScheduleItem } from '@/types'

interface PillCustomizerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule?: MedicationScheduleItem
  drugNameEn: string
  drugNameBn: string
  allScheduleIds?: string[]
}

const AVAILABLE_SHAPES: Array<{ id: PillShapeType; en: string; bn: string }> = [
  { id: 'round_tablet', en: 'Round Tablet', bn: 'গোল ট্যাবলেট' },
  { id: 'capsule', en: 'Capsule', bn: 'ক্যাপসুল' },
  { id: 'caplet_oval', en: 'Oval Caplet', bn: 'লম্বাটে ক্যাপলেট' },
  { id: 'syrup_liquid', en: 'Syrup / Liquid', bn: 'সিরাপ / তরল' },
  { id: 'drops', en: 'Eye / Ear Drops', bn: 'আই / এয়ার ড্রপ' },
  { id: 'inhaler', en: 'Inhaler', bn: 'ইনহেলার' },
  { id: 'injection_pen', en: 'Insulin Pen', bn: 'ইনসুলিন পেন' },
]

const COLOR_PALETTE = [
  { name: 'White', hex: '#FFFFFF', border: 'border-gray-300' },
  { name: 'Sky Blue', hex: '#0EA5E9', border: 'border-sky-400' },
  { name: 'Emerald', hex: '#10B981', border: 'border-emerald-400' },
  { name: 'Ruby Red', hex: '#EF4444', border: 'border-red-400' },
  { name: 'Amber Yellow', hex: '#F59E0B', border: 'border-amber-400' },
  { name: 'Rose Pink', hex: '#EC4899', border: 'border-pink-400' },
  { name: 'Purple', hex: '#8B5CF6', border: 'border-purple-400' },
  { name: 'Orange', hex: '#F97316', border: 'border-orange-400' },
]

export function PillCustomizerModal({
  open,
  onOpenChange,
  schedule,
  drugNameEn,
  drugNameBn,
}: PillCustomizerModalProps) {
  const { lang } = useLanguage()
  const isBn = lang === 'bn'
  const saveMutation = useSaveMedicationSchedule()

  const [shape, setShape] = useState<PillShapeType>(schedule?.pill_shape || 'round_tablet')
  const [primaryColor, setPrimaryColor] = useState<string>(schedule?.pill_color || '#FFFFFF')
  const [secondaryColor, setSecondaryColor] = useState<string>(
    schedule?.pill_color_secondary || '#0EA5E9'
  )

  const handleSave = async () => {
    if (schedule?.id) {
      await saveMutation.mutateAsync({
        ...schedule,
        pill_shape: shape,
        pill_color: primaryColor,
        pill_color_secondary: shape === 'capsule' ? secondaryColor : undefined,
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl space-y-4">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white">
              <Palette className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
              {isBn ? 'ঔষধের ভিজ্যুয়াল রূপ কাস্টমাইজ' : 'Customize Visual Pill Avatar'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            {isBn
              ? `${drugNameBn || drugNameEn} এর জন্য আপনার আসল ঔষধের মতো রঙ ও আকৃতি নির্বাচন করুন।`
              : `Select matching physical shape & colors for ${drugNameEn} to recognize it easily.`}
          </DialogDescription>
        </DialogHeader>

        {/* Live Preview Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-gray-50 to-gray-100/60 dark:from-gray-800/60 dark:to-gray-800/30 border border-gray-200/60 dark:border-gray-700/60 flex flex-col items-center justify-center gap-2 text-center shadow-inner">
          <PillAvatar
            shape={shape}
            color={primaryColor}
            colorSecondary={secondaryColor}
            size="xl"
          />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
              {getPillDescriptor(shape, primaryColor, lang)}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>{isBn ? 'সহজ চেনার জন্য রিয়েল-টাইম প্রিভিউ' : 'Instant visual identification'}</span>
            </p>
          </div>
        </div>

        {/* Select Shape */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {isBn ? '১. ঔষধের আকৃতি (Shape)' : '1. Select Shape'}
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AVAILABLE_SHAPES.map((s) => {
              const isSelected = shape === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setShape(s.id)}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all text-left ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <PillAvatar shape={s.id} color="#0EA5E9" size="xs" />
                  <span className="truncate text-[11px]">{isBn ? s.bn : s.en}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Select Primary Color */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {shape === 'capsule'
              ? isBn
                ? '২. ক্যাপসুলের বডি রঙ (Body Color)'
                : '2. Capsule Body Color'
              : isBn
              ? '২. ঔষধের প্রধান রঙ (Primary Color)'
              : '2. Primary Color'}
          </Label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setPrimaryColor(c.hex)}
                className={`w-7 h-7 rounded-full border-2 transition-transform relative ${c.border} ${
                  primaryColor === c.hex ? 'scale-125 shadow-md ring-2 ring-purple-500 ring-offset-2' : ''
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              >
                {primaryColor === c.hex && (
                  <Check
                    className={`h-3 w-3 absolute inset-0 m-auto ${
                      c.hex === '#FFFFFF' ? 'text-gray-900' : 'text-white'
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* If Capsule, Select Cap Color */}
        {shape === 'capsule' && (
          <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800 animate-fadeIn">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {isBn ? '৩. ক্যাপসুলের মাথার রঙ (Cap Color)' : '3. Capsule Cap Color'}
            </Label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={`sec-${c.name}`}
                  type="button"
                  onClick={() => setSecondaryColor(c.hex)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform relative ${c.border} ${
                    secondaryColor === c.hex
                      ? 'scale-125 shadow-md ring-2 ring-purple-500 ring-offset-2'
                      : ''
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {secondaryColor === c.hex && (
                    <Check
                      className={`h-3 w-3 absolute inset-0 m-auto ${
                        c.hex === '#FFFFFF' ? 'text-gray-900' : 'text-white'
                      }`}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold h-11 text-xs shadow-md"
          >
            <span>{isBn ? 'রূপ সংরক্ষণ করুন' : 'Save Appearance'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
