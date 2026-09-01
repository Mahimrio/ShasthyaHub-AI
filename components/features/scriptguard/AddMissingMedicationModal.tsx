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
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { PillAvatar } from '@/components/shared/PillAvatar'
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  Plus,
  Sparkles,
  Utensils,
} from 'lucide-react'
import type {
  ExtractedMedication,
  MealTimingType,
  PillShapeType,
  DrugInteraction,
} from '@/types'

interface AddMissingMedicationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingDrugs: ExtractedMedication[]
  onAdd: (
    newDrug: ExtractedMedication,
    mealTiming: MealTimingType,
    frequencyCode: string,
    durationDays: number,
    recalculatedInteractions?: DrugInteraction[]
  ) => void
}

export function AddMissingMedicationModal({
  open,
  onOpenChange,
  existingDrugs,
  onAdd,
}: AddMissingMedicationModalProps) {
  const { lang } = useLanguage()
  const isBn = lang === 'bn'

  const [brandName, setBrandName] = useState('')
  const [genericName, setGenericName] = useState('')
  const [dosage, setDosage] = useState('1 unit')
  const [frequency, setFrequency] = useState('1+0+1')
  const [mealTiming, setMealTiming] = useState<MealTimingType>('after_meal')
  const [durationDays, setDurationDays] = useState(7)

  const [pillShape, setPillShape] = useState<PillShapeType>('round_tablet')
  const [pillColor, setPillColor] = useState('#FFFFFF')
  const [pillColorSecondary, setPillColorSecondary] = useState<string | undefined>()
  const [descriptorBn, setDescriptorBn] = useState('সাদা গোল ট্যাবলেট')

  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [verifiedClass, setVerifiedClass] = useState('')
  const [recalculatedInteractions, setRecalculatedInteractions] = useState<DrugInteraction[]>([])

  const handleVerifyDrugName = async (nameToVerify: string) => {
    if (!nameToVerify.trim()) return
    setIsVerifying(true)

    try {
      const otherGenerics = existingDrugs
        .map((d) => d.generic_name)
        .filter(Boolean)

      const res = await fetch('/api/scriptguard/verify-drug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: nameToVerify,
          current_generics: otherGenerics,
        }),
      })

      const json = await res.json()
      if (res.ok && json.success && json.data?.verified_drug) {
        const v = json.data.verified_drug
        setBrandName(v.matched_brand_en)
        setGenericName(v.generic_name)
        setVerifiedClass(v.drug_class)
        setDosage(v.suggested_dosage || dosage)
        setPillShape(v.pill_shape)
        setPillColor(v.pill_color)
        setPillColorSecondary(v.pill_color_secondary)
        setDescriptorBn(v.descriptor_bn)
        setIsVerified(true)

        if (json.data.recalculated_interactions) {
          setRecalculatedInteractions(json.data.recalculated_interactions)
        }
      }
    } catch (err) {
      console.error('Drug verification failed', err)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandName.trim()) return

    const newMed: ExtractedMedication = {
      written_text: brandName,
      brand_name: brandName,
      generic_name: genericName || brandName,
      dosage: dosage || '1 unit',
      drug_class: verifiedClass || 'Prescribed Agent',
      frequency: frequency,
      duration: `${durationDays} days`,
      instructions: `${frequency} ${mealTiming === 'before_meal' ? 'খাবার আগে' : 'খাবার পর'}`,
      mapping_confidence: isVerified ? 'high' : 'medium',
    }

    onAdd(
      newMed,
      mealTiming,
      frequency,
      durationDays,
      recalculatedInteractions.length > 0 ? recalculatedInteractions : undefined
    )

    // Reset and close
    setBrandName('')
    setGenericName('')
    setDosage('1 unit')
    setIsVerified(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl space-y-4">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white">
              <Plus className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
              {isBn ? 'প্রেসক্রিপশনে অনুপস্থিত ওষুধ যোগ করুন' : 'Add Missing Medication'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            {isBn
              ? 'প্রেসক্রিপশনে লেখা কোনো ওষুধ বাদ পড়ে থাকলে তা যোগ করুন এবং স্বয়ংক্রিয় মিথস্ক্রিয়া যাচাই করুন।'
              : 'Add any medication missed during scanning and re-evaluate drug interactions automatically.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Live Preview Box with Pill Avatar */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-2xs">
                <PillAvatar
                  shape={pillShape}
                  color={pillColor}
                  colorSecondary={pillColorSecondary}
                  size="md"
                />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {brandName || (isBn ? 'নতুন ওষুধের নাম' : 'New Medicine')}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {genericName ? `${genericName} · ` : ''}
                  <span className="font-semibold text-sky-600 dark:text-sky-400">
                    {descriptorBn}
                  </span>
                </p>
              </div>
            </div>

            {isVerified ? (
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] flex items-center gap-1 font-bold">
                <CheckCircle2 className="h-3 w-3" />
                <span>{isBn ? 'যাচাইকৃত' : 'Verified'}</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-gray-500">
                {isBn ? 'নতুন' : 'New'}
              </Badge>
            )}
          </div>

          {/* Medicine Name with Verification */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {isBn ? 'ওষুধের নাম (Brand Name)' : 'Medicine Name'}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={brandName}
                onChange={(e) => {
                  setBrandName(e.target.value)
                  setIsVerified(false)
                }}
                placeholder="e.g. Napa Extra 500mg, Seclo 20mg, Metformin"
                className="rounded-xl border-gray-200 dark:border-gray-700 text-xs h-9.5"
                required
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleVerifyDrugName(brandName)}
                disabled={isVerifying || !brandName.trim()}
                className="h-9.5 text-xs font-bold rounded-xl px-3 shrink-0 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 hover:bg-sky-50"
              >
                {isVerifying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-sky-600" />
                )}
                <span>{isBn ? 'যাচাই' : 'Verify'}</span>
              </Button>
            </div>
            {verifiedClass && (
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {isBn ? 'ঔষধের শ্রেণী:' : 'Class:'}{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {verifiedClass}
                </span>
              </p>
            )}
          </div>

          {/* Dosage & Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {isBn ? 'মাত্রা (Strength)' : 'Strength'}
              </Label>
              <Input
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 500mg, 1 tablet"
                className="rounded-xl border-gray-200 dark:border-gray-700 text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Clock className="h-3 w-3 text-sky-500" />
                <span>{isBn ? 'গ্রহণের নিয়ম' : 'Frequency'}</span>
              </Label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs px-2.5 text-gray-800 dark:text-gray-200"
              >
                <option value="1+0+1">১+০+১ (সকাল ও রাত / Twice Daily)</option>
                <option value="1+1+1">১+১+১ (সকাল, দুপুর, রাত / 3 Times)</option>
                <option value="0+0+1">০+০+১ (শুধুমাত্র রাতে / Night Only)</option>
                <option value="1+0+0">১+০+০ (শুধুমাত্র সকালে / Morning Only)</option>
                <option value="every_8h">৮ ঘণ্টা পর পর (Every 8 Hours)</option>
                <option value="every_6h">৬ ঘণ্টা পর পর (Every 6 Hours)</option>
              </select>
            </div>
          </div>

          {/* Meal Timing & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Utensils className="h-3 w-3 text-teal-500" />
                <span>{isBn ? 'খাবারের শর্ত' : 'Meal Relation'}</span>
              </Label>
              <select
                value={mealTiming}
                onChange={(e) => setMealTiming(e.target.value as MealTimingType)}
                className="w-full h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs px-2.5 text-gray-800 dark:text-gray-200"
              >
                <option value="after_meal">{isBn ? 'খাবার পর' : 'After meal'}</option>
                <option value="before_meal">
                  {isBn ? 'খাবার ৩০ মিনিট আগে' : '30 mins before meal'}
                </option>
                <option value="empty_stomach">{isBn ? 'খালি পেটে' : 'Empty stomach'}</option>
                <option value="with_meal">{isBn ? 'খাবারের সাথে' : 'With meal'}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {isBn ? 'কোর্স মেয়াদ (Days)' : 'Duration (Days)'}
              </Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 7)}
                className="rounded-xl border-gray-200 dark:border-gray-700 text-xs h-9"
              />
            </div>
          </div>

          {/* Recalculated Interactions Alert */}
          {recalculatedInteractions.length > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-200 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1 text-[11px]">
                <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                <span>
                  {isBn
                    ? 'নতুন ওষুধ যোগ করায় সম্ভাব্য ড্রাগ ইন্টারঅ্যাকশন পাওয়া গেছে:'
                    : 'Potential interaction detected with other medications:'}
                </span>
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-300">
                {recalculatedInteractions[0].risk_en}
              </p>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-bold h-11 text-xs shadow-md"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>{isBn ? 'প্রেসক্রিপশনে যোগ করুন' : 'Add to Prescription'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
