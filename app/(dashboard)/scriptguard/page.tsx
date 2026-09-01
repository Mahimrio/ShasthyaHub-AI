'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileScan,
  Lightbulb,
  Pill,
  RotateCcw,
  Search,
  Send,
  Stethoscope,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useScriptGuardAnalysis } from '@/hooks/useScriptGuardAnalysis'
import { useMedicationDoses } from '@/hooks/useMedicationReminders'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { DisclaimerModal } from '@/components/shared/DisclaimerModal'
import { AnalyzingAnimation } from '@/components/shared/AnalyzingAnimation'
import { ResultCard } from '@/components/shared/ResultCard'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ExtractedMedsTable from '@/components/features/scriptguard/ExtractedMedsTable'
import DrugInteractionAlert from '@/components/features/scriptguard/DrugInteractionAlert'
import MedicationScheduleTimeline from '@/components/features/scriptguard/MedicationScheduleTimeline'
import AudioGuide from '@/components/features/scriptguard/AudioGuide'
import { MyMedicinesCabinet } from '@/components/features/scriptguard/MyMedicinesCabinet'
import { EditMedicationModal } from '@/components/features/scriptguard/EditMedicationModal'
import { AddMissingMedicationModal } from '@/components/features/scriptguard/AddMissingMedicationModal'
import { SaveToCabinetModal } from '@/components/features/scriptguard/SaveToCabinetModal'
import { buildScheduleLocally } from '@/lib/services/schedule'
import type { ExtractedMedication, MealTimingType, DrugInteraction } from '@/types'

const DISCLAIMER_KEY = 'scriptguard_disclaimer_seen'

export default function ScriptGuardPage() {
  const { lang } = useLanguage()
  const isBn = lang === 'bn'
  const { isOnline } = useNetworkStatus()
  const { analyze, result, isLoading, isError, error, reset, updateResult } =
    useScriptGuardAnalysis()

  const { data: dosesData } = useMedicationDoses()
  const activeMedsCount = dosesData?.doses
    ? new Set(dosesData.doses.map((d) => d.schedule.drug_name_en.toLowerCase())).size
    : 0

  const [activeTab, setActiveTab] = useState<'scanner' | 'cabinet'>('scanner')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // HITL Modals State
  const [editingDrugIndex, setEditingDrugIndex] = useState<number | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSaveToCabinetOpen, setIsSaveToCabinetOpen] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  // SSR-safe: closed during prerender (window undefined), opens after mount
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(DISCLAIMER_KEY)
  })

  const handleImageSelect = useCallback((file: File) => {
    setSelectedFile(file)
  }, [])

  const handleAcceptDisclaimer = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.setItem(DISCLAIMER_KEY, '1')
    setShowDisclaimer(false)
    if (selectedFile) void analyze(selectedFile)
  }, [selectedFile, analyze])

  const handleAnalyzeClick = useCallback(() => {
    if (!selectedFile) return
    const seen =
      typeof window !== 'undefined' && localStorage.getItem(DISCLAIMER_KEY)
    if (!seen) {
      setShowDisclaimer(true)
      return
    }
    void analyze(selectedFile)
  }, [selectedFile, analyze])

  const handleReset = useCallback(() => {
    reset()
    setSelectedFile(null)
    setEditingDrugIndex(null)
    setIsAddModalOpen(false)
    setSaveSuccessMsg(null)
  }, [reset])

  // ── HITL Handlers ──────────────────────────────────────────

  const handleSaveEditedDrug = (
    index: number,
    updatedDrug: ExtractedMedication,
    mealTiming: MealTimingType,
    frequencyCode: string,
    durationDays: number,
    recalculatedInteractions?: DrugInteraction[]
  ) => {
    if (!result) return

    const newExtracted = [...result.extracted_drugs]
    newExtracted[index] = {
      ...updatedDrug,
      instructions: `${frequencyCode} ${
        mealTiming === 'before_meal'
          ? 'খাবার আগে'
          : mealTiming === 'empty_stomach'
          ? 'খালি পেটে'
          : 'খাবার পর'
      }`,
      frequency: frequencyCode,
    }

    const newSchedule = buildScheduleLocally(newExtracted)

    updateResult({
      ...result,
      extracted_drugs: newExtracted,
      schedule: {
        morning: newSchedule.morning,
        afternoon: newSchedule.afternoon,
        evening: newSchedule.evening,
        night: newSchedule.night,
      },
      duration_days: durationDays || result.duration_days,
      interaction_warnings: recalculatedInteractions || result.interaction_warnings,
      has_dangerous_interactions: recalculatedInteractions
        ? recalculatedInteractions.some((i) => i.severity === 'Severe' || i.severity === 'Critical')
        : result.has_dangerous_interactions,
    })

    setSaveSuccessMsg(
      isBn
        ? `"${updatedDrug.brand_name}" সফলভাবে সংশোধন ও যাচাই করা হয়েছে!`
        : `"${updatedDrug.brand_name}" has been verified and updated!`
    )
    setTimeout(() => setSaveSuccessMsg(null), 4000)
  }

  const handleAddMissingDrug = (
    newDrug: ExtractedMedication,
    mealTiming: MealTimingType,
    frequencyCode: string,
    durationDays: number,
    recalculatedInteractions?: DrugInteraction[]
  ) => {
    if (!result) return

    const newExtracted = [
      ...result.extracted_drugs,
      {
        ...newDrug,
        instructions: `${frequencyCode} ${
          mealTiming === 'before_meal'
            ? 'খাবার আগে'
            : mealTiming === 'empty_stomach'
            ? 'খালি পেটে'
            : 'খাবার পর'
        }`,
        frequency: frequencyCode,
      },
    ]

    const newSchedule = buildScheduleLocally(newExtracted)

    updateResult({
      ...result,
      extracted_drugs: newExtracted,
      schedule: {
        morning: newSchedule.morning,
        afternoon: newSchedule.afternoon,
        evening: newSchedule.evening,
        night: newSchedule.night,
      },
      duration_days: durationDays || result.duration_days,
      interaction_warnings: recalculatedInteractions || result.interaction_warnings,
      has_dangerous_interactions: recalculatedInteractions
        ? recalculatedInteractions.some((i) => i.severity === 'Severe' || i.severity === 'Critical')
        : result.has_dangerous_interactions,
    })

    setSaveSuccessMsg(
      isBn
        ? `"${newDrug.brand_name}" প্রেসক্রিপশনে যুক্ত হয়েছে!`
        : `"${newDrug.brand_name}" added to prescription!`
    )
    setTimeout(() => setSaveSuccessMsg(null), 4000)
  }

  const handleDeleteDrug = (index: number) => {
    if (!result) return

    const deletedName = result.extracted_drugs[index]?.brand_name
    const newExtracted = result.extracted_drugs.filter((_, i) => i !== index)
    const newSchedule = buildScheduleLocally(newExtracted)

    updateResult({
      ...result,
      extracted_drugs: newExtracted,
      schedule: {
        morning: newSchedule.morning,
        afternoon: newSchedule.afternoon,
        evening: newSchedule.evening,
        night: newSchedule.night,
      },
    })

    setSaveSuccessMsg(
      isBn ? `"${deletedName}" মুছে ফেলা হয়েছে।` : `"${deletedName}" removed.`
    )
    setTimeout(() => setSaveSuccessMsg(null), 3000)
  }

  const specialInstructions =
    lang === 'bn'
      ? result?.special_instructions_bn ?? []
      : result?.special_instructions_en ?? []

  const scriptGuardStages = [
    { en: 'Sending prescription to Vision Engine...', bn: 'প্রেসক্রিপশন ভিশন ইঞ্জিনে পাঠানো হচ্ছে...', icon: Send },
    { en: 'Extracting medication details...', bn: 'ওষুধের তথ্য বের করা হচ্ছে...', icon: Search },
    { en: 'Checking drug interactions...', bn: 'ওষুধের মিথস্ক্রিয়া যাচাই করা হচ্ছে...', icon: Stethoscope },
    { en: 'Generating schedule & report...', bn: 'সময়সূচি ও রিপোর্ট তৈরি হচ্ছে...', icon: ClipboardList },
    { en: 'Almost done...', bn: 'প্রায় শেষ...', icon: CheckCircle2 },
  ]

  return (
    <>
      <DisclaimerModal
        open={showDisclaimer}
        onOpenChange={setShowDisclaimer}
        onAccept={handleAcceptDisclaimer}
      />

      {isLoading && (
        <AnalyzingAnimation
          stages={scriptGuardStages}
          icon={
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
              <ClipboardList className="h-10 w-10 text-white" />
            </div>
          }
        />
      )}

      {/* Dynamic Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/20 dark:from-gray-950 dark:via-emerald-950/30 dark:to-teal-950/20 animate-gradient-bg z-0 motion-reduce:animate-none">
        <div className="absolute -left-32 top-10 h-[700px] w-[700px] rounded-full bg-emerald-300/40 dark:bg-emerald-500/20 blur-[140px] animate-float-1" />
        <div className="absolute -right-32 top-40 h-[700px] w-[700px] rounded-full bg-teal-300/35 dark:bg-teal-500/20 blur-[140px] animate-float-2" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[500px] w-[800px] rounded-full bg-cyan-200/25 dark:cyan-600/15 blur-[160px] animate-float-3" />
      </div>

      <div className="relative min-h-screen z-10">
        <div className="relative z-10 mx-auto max-w-4xl space-y-6 p-4 md:p-6">
          {/* Header */}
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20 text-white">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 md:text-2xl">
                {isBn
                  ? 'স্ক্রিপ্টগার্ড — প্রেসক্রিপশন ও ঔষধ ব্যবস্থাপনা'
                  : 'ScriptGuard — Prescription & Medicine Cabinet'}
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {isBn
                  ? 'প্রেসক্রিপশন স্ক্যানিং, ওষুধের মিথস্ক্রিয়া যাচাই ও ভার্চুয়াল পিলবক্স ট্র্যাকিং।'
                  : 'Prescription scanning, drug safety screening & virtual pillbox inventory management.'}
              </p>
            </div>
          </div>

          {/* Primary View Switcher Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as 'scanner' | 'cabinet')}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-gray-200/80 dark:border-gray-800 pb-3 gap-2 flex-wrap">
              <TabsList className="bg-gray-100/90 dark:bg-gray-900/90 p-1 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-2xs">
                <TabsTrigger
                  value="scanner"
                  className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <FileScan className="h-4 w-4" />
                  <span>{isBn ? 'প্রেসক্রিপশন স্ক্যানার' : 'Prescription Scanner'}</span>
                </TabsTrigger>

                <TabsTrigger
                  value="cabinet"
                  className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-sky-600 dark:data-[state=active]:text-sky-400 data-[state=active]:shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <Pill className="h-4 w-4" />
                  <span>
                    {isBn ? 'আমার ঔষধ তালিকা' : 'My Medicines'}
                    {activeMedsCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 text-[10px] font-mono">
                        {activeMedsCount}
                      </span>
                    )}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Prescription Scanner & HITL Review */}
            <TabsContent value="scanner" className="space-y-6 focus:outline-none">
              {/* How it works Banner */}
              {!result && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                    <Lightbulb className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{isBn ? 'কীভাবে কাজ করে' : 'How it works'}</span>
                  </div>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-gray-600 dark:text-gray-400">
                    <li>
                      {isBn
                        ? 'প্রেসক্রিপশনের পরিষ্কার ছবি আপলোড করুন।'
                        : 'Upload a clear photo of your prescription.'}
                    </li>
                    <li>
                      {isBn
                        ? 'AI স্বয়ংক্রিয়ভাবে ওষুধের নাম পড়ে ড্রাগ ইন্টারঅ্যাকশন ও রুটিন তৈরি করবে।'
                        : 'AI reads drug names, checks interactions & builds your daily routine.'}
                    </li>
                    <li>
                      {isBn
                        ? 'প্রয়োজনে ওষুধের ভুল নাম সংশোধন ও নতুন ওষুধ যোগ করতে পারবেন।'
                        : 'Review, fix typos, or add missing medications with live verification.'}
                    </li>
                  </ul>
                </div>
              )}

              {/* Upload + analyze button */}
              {!result && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                  <ImageUploader
                    onImageSelect={handleImageSelect}
                    acceptedTypes="image/*"
                    maxSizeMB={5}
                  />
                  <Button
                    onClick={handleAnalyzeClick}
                    disabled={!selectedFile || isLoading || !isOnline}
                    className="mt-4 w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-[length:200%_100%] animate-gradient-x py-6 text-base font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.99] transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    {isBn ? 'প্রেসক্রিপশন বিশ্লেষণ করুন' : 'Analyze Prescription'}
                  </Button>
                </motion.div>
              )}

              {/* Error state */}
              {isError && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>
                      {isBn ? 'বিশ্লেষণ ব্যর্থ হয়েছে' : 'Analysis Failed'}
                    </AlertTitle>
                    <AlertDescription>
                      <p className="mb-3">{error}</p>
                      <Button
                        onClick={handleAnalyzeClick}
                        variant="outline"
                        size="sm"
                        className="border-destructive/50 text-destructive hover:bg-destructive/10"
                      >
                        <RotateCcw className="mr-2 h-3.5 w-3.5" />
                        {isBn ? 'আবার চেষ্টা করুন' : 'Try Again'}
                      </Button>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {/* Success Notification Banner on Edit / Add */}
              {saveSuccessMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </motion.div>
              )}

              {/* Result View */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-5"
                >
                  {/* 1. Drug interactions */}
                  <DrugInteractionAlert
                    interactions={result.interaction_warnings}
                    hasDangerous={result.has_dangerous_interactions}
                    lang={lang}
                  />

                  {/* 2. Extracted medications with HITL Edit & Add */}
                  <ResultCard
                    title={isBn ? 'শনাক্তকৃত ওষুধ ও পর্যালোচনা' : 'Identified Medications & Review'}
                    badge={{
                      label: `${result.extracted_drugs.length} ${
                        isBn ? 'টি ওষুধ' : 'drugs'
                      }`,
                      variant: 'normal',
                    }}
                  >
                    <div className="pt-3">
                      <ExtractedMedsTable
                        drugs={result.extracted_drugs}
                        lang={lang}
                        onEditDrug={(idx) => setEditingDrugIndex(idx)}
                        onAddDrug={() => setIsAddModalOpen(true)}
                        onDeleteDrug={handleDeleteDrug}
                        onSaveToCabinet={() => setIsSaveToCabinetOpen(true)}
                      />
                    </div>
                  </ResultCard>

                  {/* 3. Medication schedule timeline */}
                  <ResultCard
                    title={isBn ? 'ওষুধ গ্রহণের সময়সূচি ও রিমাইন্ডার' : 'Medication Schedule & Reminders'}
                    badge={{ label: isBn ? 'প্রতিদিন' : 'Daily', variant: 'low' }}
                  >
                    <div className="pt-3">
                      <MedicationScheduleTimeline
                        schedule={result.schedule}
                        durationDays={result.duration_days}
                        specialInstructions={specialInstructions}
                        lang={lang}
                        prescriptionId={result.id}
                        extractedDrugs={result.extracted_drugs}
                        onSwitchToCabinet={() => setActiveTab('cabinet')}
                      />
                    </div>
                  </ResultCard>

                  {/* 4. Audio guide */}
                  <AudioGuide
                    audioScriptBn={result.audio_script_bn}
                    lang={lang}
                  />

                  {/* Reset / Scan Another */}
                  <div className="pt-2">
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="w-full rounded-2xl py-5 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {isBn ? 'নতুন প্রেসক্রিপশন পরীক্ষা করুন' : 'Scan Another Prescription'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </TabsContent>

            {/* TAB 2: My Medicines & Pillbox */}
            <TabsContent value="cabinet" className="focus:outline-none">
              <MyMedicinesCabinet />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Sub Modals for HITL Review */}
      {result && editingDrugIndex !== null && result.extracted_drugs[editingDrugIndex] && (
        <EditMedicationModal
          open={editingDrugIndex !== null}
          onOpenChange={(open) => !open && setEditingDrugIndex(null)}
          drug={result.extracted_drugs[editingDrugIndex]}
          index={editingDrugIndex}
          allDrugs={result.extracted_drugs}
          onSave={handleSaveEditedDrug}
        />
      )}

      {result && (
        <AddMissingMedicationModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          existingDrugs={result.extracted_drugs}
          onAdd={handleAddMissingDrug}
        />
      )}

      {result && (
        <SaveToCabinetModal
          open={isSaveToCabinetOpen}
          onOpenChange={setIsSaveToCabinetOpen}
          drugs={result.extracted_drugs}
          schedule={result.schedule}
          durationDays={result.duration_days}
          prescriptionId={result.id}
          onSwitchToCabinet={() => setActiveTab('cabinet')}
        />
      )}
    </>
  )
}
