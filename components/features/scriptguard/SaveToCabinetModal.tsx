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
import { useLanguage } from '@/contexts/LanguageContext'
import { PillAvatar } from '@/components/shared/PillAvatar'
import { inferPillAvatar } from '@/lib/services/medication-reminder'
import { useSavePrescriptionToReminders } from '@/hooks/useMedicationReminders'
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Pill,
  ShieldCheck,
} from 'lucide-react'
import type { ExtractedMedication, MedicationSchedule } from '@/types'

interface SaveToCabinetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  drugs: ExtractedMedication[]
  schedule: Pick<MedicationSchedule, 'morning' | 'afternoon' | 'evening' | 'night'>
  durationDays: number
  prescriptionId?: string
  onSwitchToCabinet?: () => void
}

export function SaveToCabinetModal({
  open,
  onOpenChange,
  drugs,
  schedule,
  durationDays,
  prescriptionId,
  onSwitchToCabinet,
}: SaveToCabinetModalProps) {
  const { lang } = useLanguage()
  const isBn = lang === 'bn'

  const saveMutation = useSavePrescriptionToReminders()

  // Selected drugs state (indices)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    () => new Set(drugs.map((_, i) => i))
  )
  const [stockCounts, setStockCounts] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {}
    drugs.forEach((_, i) => {
      initial[i] = Math.max(10, (durationDays || 7) * 2)
    })
    return initial
  })

  const [savedSuccess, setSavedSuccess] = useState(false)

  const toggleSelect = (index: number) => {
    const next = new Set(selectedIndices)
    if (next.has(index)) {
      if (next.size > 1) next.delete(index)
    } else {
      next.add(index)
    }
    setSelectedIndices(next)
  }

  const handleStockChange = (index: number, count: number) => {
    setStockCounts((prev) => ({ ...prev, [index]: Math.max(1, count) }))
  }

  const handleConfirmSave = async () => {
    if (selectedIndices.size === 0) return

    // Filter schedule slots to only include selected drugs
    const selectedDrugNames = Array.from(selectedIndices).map(
      (idx) => (drugs[idx].brand_name || drugs[idx].written_text).toLowerCase()
    )

    const filteredSchedule: Pick<
      MedicationSchedule,
      'morning' | 'afternoon' | 'evening' | 'night'
    > = {
      morning: schedule.morning.filter((s) =>
        selectedDrugNames.some(
          (name) =>
            s.drug_bn.toLowerCase().includes(name) ||
            s.drug_en.toLowerCase().includes(name) ||
            name.includes(s.drug_bn.toLowerCase()) ||
            name.includes(s.drug_en.toLowerCase())
        )
      ),
      afternoon: schedule.afternoon.filter((s) =>
        selectedDrugNames.some(
          (name) =>
            s.drug_bn.toLowerCase().includes(name) ||
            s.drug_en.toLowerCase().includes(name) ||
            name.includes(s.drug_bn.toLowerCase()) ||
            name.includes(s.drug_en.toLowerCase())
        )
      ),
      evening: schedule.evening.filter((s) =>
        selectedDrugNames.some(
          (name) =>
            s.drug_bn.toLowerCase().includes(name) ||
            s.drug_en.toLowerCase().includes(name) ||
            name.includes(s.drug_bn.toLowerCase()) ||
            name.includes(s.drug_en.toLowerCase())
        )
      ),
      night: schedule.night.filter((s) =>
        selectedDrugNames.some(
          (name) =>
            s.drug_bn.toLowerCase().includes(name) ||
            s.drug_en.toLowerCase().includes(name) ||
            name.includes(s.drug_bn.toLowerCase()) ||
            name.includes(s.drug_en.toLowerCase())
        )
      ),
    }

    const quantitiesMap: Record<string, number> = {}
    selectedIndices.forEach((idx) => {
      const drug = drugs[idx]
      const brand = (drug.brand_name || drug.written_text || '').toLowerCase().trim()
      const generic = (drug.generic_name || '').toLowerCase().trim()
      const count = stockCounts[idx] ?? 14
      if (brand) quantitiesMap[brand] = count
      if (generic) quantitiesMap[generic] = count
    })

    try {
      await saveMutation.mutateAsync({
        prescription_id: prescriptionId || `rx_${Date.now()}`,
        digital_schedule: {
          ...filteredSchedule,
          duration_days: durationDays || 7,
          special_instructions_en: [],
          special_instructions_bn: [],
          audio_script_bn: '',
        },
        quantities_map: quantitiesMap,
      })

      setSavedSuccess(true)
    } catch (err) {
      console.error('Failed to save to reminders cabinet:', err)
    }
  }

  const handleViewCabinet = () => {
    onOpenChange(false)
    if (onSwitchToCabinet) {
      onSwitchToCabinet()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-sm">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
                {isBn
                  ? 'ঔষধ তালিকায় সংরক্ষণ ও রিমাইন্ডার সেট'
                  : 'Save to Medicine Cabinet & Set Alarms'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                {isBn
                  ? 'কোন ওষুধগুলো আপনার দৈনিক রুটিন ও পিলবক্সে যোগ করতে চান তা নির্বাচন করুন।'
                  : 'Select which medications to import into your virtual pillbox and activate daily alarms.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {savedSuccess ? (
          <div className="py-6 text-center space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {isBn
                  ? 'ওষুধগুলো সফলভাবে যুক্ত ও রিমাইন্ডার সক্রিয় হয়েছে!'
                  : 'Medications Saved & Alarms Activated!'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {isBn
                  ? 'দৈনিক নোটিফিকেশন ও স্টক ট্র্যাকিং চালু হয়েছে। আপনি "আমার ঔষধ তালিকা" ট্যাবে সব সময় এটি দেখতে পাবেন।'
                  : 'Daily alarms and inventory countdown are live in your virtual pillbox.'}
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2 justify-center">
              <Button
                type="button"
                onClick={handleViewCabinet}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold h-10 px-5 shadow-sm"
              >
                <span>{isBn ? 'আমার ঔষধ তালিকা দেখুন' : 'View My Medicines'}</span>
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-2xl text-xs font-semibold h-10 px-4"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selection Toolbar */}
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {isBn
                  ? `নির্বাচিত: ${selectedIndices.size}/${drugs.length}টি ওষুধ`
                  : `Selected: ${selectedIndices.size}/${drugs.length} medicines`}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedIndices(new Set(drugs.map((_, i) => i)))}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {isBn ? 'সব নির্বাচন' : 'Select All'}
                </button>
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedIndices(new Set())}
                  className="text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:underline"
                >
                  {isBn ? 'সব বাদ' : 'Clear All'}
                </button>
              </div>
            </div>

            {/* Medications checklist */}
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {drugs.map((drug, i) => {
                const isSelected = selectedIndices.has(i)
                const avatar = inferPillAvatar(
                  drug.brand_name || drug.written_text,
                  drug.dosage
                )
                const currentStock = stockCounts[i] ?? 14

                return (
                  <div
                    key={`${drug.written_text}-${i}`}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                      isSelected
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-2xs'
                        : 'bg-gray-50/60 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(i)}
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
                        />

                        <div className="p-1 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0">
                          <PillAvatar
                            shape={avatar.shape}
                            color={avatar.color}
                            colorSecondary={avatar.colorSecondary}
                            size="sm"
                          />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                            {drug.brand_name || drug.written_text}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                            <span>{drug.dosage || '1 unit'}</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {avatar.descriptorBn}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stock Pill Counter */}
                      {isSelected && (
                        <div className="flex items-center gap-1 shrink-0 bg-white dark:bg-gray-800 px-2 py-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleStockChange(i, currentStock - 1)}
                            className="w-5 h-5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold flex items-center justify-center"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={180}
                            value={currentStock}
                            onChange={(e) =>
                              handleStockChange(i, parseInt(e.target.value, 10) || 1)
                            }
                            className="w-10 text-center text-xs font-mono font-bold bg-transparent text-gray-900 dark:text-gray-100 border-none focus:outline-none p-0"
                            title={isBn ? 'প্রাথমিক স্টক সংখ্যা' : 'Stock quantity'}
                          />
                          <button
                            type="button"
                            onClick={() => handleStockChange(i, currentStock + 1)}
                            className="w-5 h-5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold flex items-center justify-center"
                          >
                            +
                          </button>
                          <span className="text-[10px] text-gray-400 pl-0.5">
                            {isBn ? 'টি' : 'pills'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick quantity chips */}
                    {isSelected && (
                      <div className="flex items-center gap-1.5 pl-7 pt-1 border-t border-gray-100 dark:border-gray-800/80">
                        <span className="text-[10px] text-gray-400 font-medium">
                          {isBn ? 'পরিমাণ সেট:' : 'Quick stock:'}
                        </span>
                        {[7, 10, 14, 20, 30].map((qty) => (
                          <button
                            key={qty}
                            type="button"
                            onClick={() => handleStockChange(i, qty)}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                              currentStock === qty
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            {qty}{isBn ? 'টি' : ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Quick Summary Note */}
            <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-900/50 flex items-start gap-2 text-xs text-sky-900 dark:text-sky-200">
              <ShieldCheck className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                {isBn
                  ? 'সংরক্ষণ করলে নির্বাচিত ওষুধগুলোর জন্য নির্ধারিত পরিমাণ স্টক এবং সকাল, দুপুর, রাত অনুযায়ী অ্যালার্ম চালু হবে।'
                  : 'Importing will set exact initial pill stocks and activate daily alarms in your virtual cabinet.'}
              </p>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center gap-2">
              <Button
                type="button"
                onClick={handleConfirmSave}
                disabled={saveMutation.isPending || selectedIndices.size === 0}
                className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold h-11 text-xs shadow-md"
              >
                {saveMutation.isPending ? (
                  <span>{isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving to Cabinet...'}</span>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    <span>
                      {isBn
                        ? `${selectedIndices.size}টি ওষুধ সংরক্ষণ ও রিমাইন্ডার চালু করুন`
                        : `Save ${selectedIndices.size} Medicines & Activate Alarms`}
                    </span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-2xl text-xs font-semibold h-11 px-4"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
