'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ClipboardList,
  Sparkles,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ResultCard } from '@/components/shared/ResultCard'
import ExtractedMedsTable from '@/components/features/scriptguard/ExtractedMedsTable'
import DrugInteractionAlert from '@/components/features/scriptguard/DrugInteractionAlert'
import MedicationScheduleTimeline from '@/components/features/scriptguard/MedicationScheduleTimeline'
import AudioGuide from '@/components/features/scriptguard/AudioGuide'
import type {
  DrugInteraction,
  ExtractedMedication,
  MedicationSchedule,
  ScriptGuardResult,
} from '@/types'

// --- Hardcoded demo data ----------------------------------------------------

const DEMO_DRUGS: ExtractedMedication[] = [
  {
    written_text: 'Napa 500mg',
    brand_name: 'Napa',
    generic_name: 'Paracetamol',
    drug_class: 'Analgesic / Antipyretic',
    dosage: '500mg',
    frequency: '1+0+1',
    duration: '5 days',
    instructions: 'After meal',
    mapping_confidence: 'high',
  },
  {
    written_text: 'Seclo 20mg',
    brand_name: 'Seclo',
    generic_name: 'Omeprazole',
    drug_class: 'Proton Pump Inhibitor',
    dosage: '20mg',
    frequency: '0+0+1',
    duration: '7 days',
    instructions: 'Before meal (empty stomach)',
    mapping_confidence: 'high',
  },
  {
    written_text: 'Azimax 500mg',
    brand_name: 'Azimax',
    generic_name: 'Azithromycin',
    drug_class: 'Macrolide Antibiotic',
    dosage: '500mg',
    frequency: '1+0+0',
    duration: '3 days',
    instructions: 'After meal, plenty of water',
    mapping_confidence: 'medium',
  },
]

const DEMO_INTERACTIONS: DrugInteraction[] = [
  {
    drugs_involved: ['Paracetamol', 'Azithromycin'],
    severity: 'Mild',
    mechanism_en:
      'Both drugs are metabolized by the liver (CYP450). Concurrent use may slightly increase hepatic workload, but is generally safe at therapeutic doses.',
    risk_en:
      'Mild hepatic concern. Both paracetamol and azithromycin are processed by the liver — taking them together at normal doses is usually safe, but avoid alcohol and do not exceed 4g of paracetamol per day.',
    risk_bn:
      'হালকা যকৃত-সংক্রান্ত সতর্কতা। প্যারাসিটামল ও অ্যাজিথ্রোমাইসিন উভয়ই লিভারে কাজ করে — স্বাভাবিক মাত্রায় একসাথে নেওয়া সাধারণত নিরাপদ, তবে অ্যালকোহল এড়িয়ে চলুন এবং দিনে ৪ গ্রামের বেশি প্যারাসিটামল নেবেন না।',
    recommendation_en:
      'Continue both medications as prescribed. Avoid alcohol during the course.',
    recommendation_bn:
      'ডাক্তারের নির্দেশ অনুযায়ী দুটি ওষুধই চালিয়ে যান। কোর্স চলাকালীন অ্যালকোহল এড়িয়ে চলুন।',
  },
]

const DEMO_SCHEDULE: Pick<
  MedicationSchedule,
  'morning' | 'afternoon' | 'evening' | 'night'
> = {
  morning: [
    {
      drug_en: 'Napa (Paracetamol)',
      drug_bn: 'নাপা (প্যারাসিটামল)',
      dosage: '500mg',
      instructions_en: 'After breakfast',
      instructions_bn: 'সকালের নাস্তার পর',
    },
    {
      drug_en: 'Azimax (Azithromycin)',
      drug_bn: 'অ্যাজিম্যাক্স (অ্যাজিথ্রোমাইসিন)',
      dosage: '500mg',
      instructions_en: 'After breakfast, with water',
      instructions_bn: 'সকালের নাস্তার পর, প্রচুর পানি সহ',
    },
  ],
  afternoon: [],
  evening: [
    {
      drug_en: 'Napa (Paracetamol)',
      drug_bn: 'নাপা (প্যারাসিটামল)',
      dosage: '500mg',
      instructions_en: 'After snack',
      instructions_bn: 'বিকেলের নাস্তার পর',
    },
  ],
  night: [
    {
      drug_en: 'Seclo (Omeprazole)',
      drug_bn: 'সেকলো (ওমেপ্রাজল)',
      dosage: '20mg',
      instructions_en: 'Before dinner (empty stomach)',
      instructions_bn: 'রাতের খাবারের আগে (খালি পেটে)',
    },
  ],
}

const DEMO_SPECIAL_EN = [
  'Complete the full 3-day Azithromycin course even if you feel better.',
  'Take Seclo 30 minutes before dinner on an empty stomach.',
  'Drink plenty of water throughout the day.',
]

const DEMO_SPECIAL_BN = [
  'ভালো বোধ করলেও অ্যাজিথ্রোমাইসিনের সম্পূর্ণ ৩ দিনের কোর্স শেষ করুন।',
  'সেকলো রাতের খাবারের ৩০ মিনিট আগে খালি পেটে খান।',
  'সারাদিন প্রচুর পানি পান করুন।',
]

const DEMO_AUDIO_SCRIPT_BN =
  'আসসালামু আলাইকুম। আপনার ওষুধের সময়সূচি নিচে দেওয়া হলো। ' +
  'সকালে খাবারের পর নাপা প্যারাসিটামল পাঁচশো মিলিগ্রাম এবং অ্যাজিম্যাক্স অ্যাজিথ্রোমাইসিন পাঁচশো মিলিগ্রাম খাবেন। ' +
  'দুপুরে কোনো ওষুধ নেই। ' +
  'সন্ধ্যায় খাবারের পর নাপা প্যারাসিটামল পাঁচশো মিলিগ্রাম খাবেন। ' +
  'রাতে খাবারের আগে খালি পেটে সেকলো ওমেপ্রাজল বিশ মিলিগ্রাম খাবেন। ' +
  'মনে রাখবেন, ভালো বোধ করলেও অ্যাজিথ্রোমাইসিনের সম্পূর্ণ তিন দিনের কোর্স শেষ করতে হবে। ' +
  'সারাদিন প্রচুর পানি পান করুন। ধন্যবাদ।'

const DEMO_RESULT: ScriptGuardResult = {
  id: 'demo-scriptguard-0001',
  extracted_drugs: DEMO_DRUGS,
  interaction_warnings: DEMO_INTERACTIONS,
  // Demo intentionally uses only a Mild interaction so the UI shows the
  // "moderate/mild" yellow path, not the full-screen red critical banner.
  has_dangerous_interactions: false,
  gemini_raw: {
    raw_text: '[demo] Napa 500mg 1+0+1, Seclo 20mg 0+0+1, Azimax 500mg 1+0+0',
    medications: [],
    prescriber_qualification: null,
    prescription_date: null,
    ocr_confidence: 0.98,
  },
  schedule: DEMO_SCHEDULE,
  duration_days: 7,
  special_instructions_en: DEMO_SPECIAL_EN,
  special_instructions_bn: DEMO_SPECIAL_BN,
  audio_script_bn: DEMO_AUDIO_SCRIPT_BN,
}

export default function DemoScriptGuardPage() {
  const { lang } = useLanguage()

  // Toggle EN/BN for the demo interaction card body (independent of the
  // global language switch, so reviewers can compare both quickly).
  const [showBnInteraction, setShowBnInteraction] = useState(lang === 'bn')

  const specialInstructions = lang === 'bn' ? DEMO_SPECIAL_BN : DEMO_SPECIAL_EN

  const toggleInteractionLang = useCallback(() => {
    setShowBnInteraction((v) => !v)
  }, [])

  const demoInteractionLang = showBnInteraction ? 'bn' : 'en'

  return (
    <>
      {/* Dynamic Animated Fixed Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/20 dark:from-gray-950 dark:via-emerald-950/30 dark:to-teal-950/20 animate-gradient-bg z-0">
        {/* Ambient Radial Gradient Blobs */}
        <div className="absolute -left-32 top-10 h-[700px] w-[700px] rounded-full bg-emerald-300/40 dark:bg-emerald-500/20 blur-[140px] animate-float-1" />
        <div className="absolute -right-32 top-40 h-[700px] w-[700px] rounded-full bg-teal-300/35 dark:bg-teal-500/20 blur-[140px] animate-float-2" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[500px] w-[800px] rounded-full bg-cyan-200/25 dark:bg-cyan-600/15 blur-[160px] animate-float-3" />
      </div>

      <div className="relative min-h-screen z-10">
        <div className="relative z-10 mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      {/* Demo mode banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-2xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-900/50 dark:bg-purple-900/20"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/60">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-purple-800 dark:text-purple-200">
            {lang === 'bn' ? '✨ ডেমো মোড' : '✨ Demo Mode'}
          </p>
          <p className="text-xs text-purple-700 dark:text-purple-300">
            {lang === 'bn'
              ? 'এই ফলাফলটি নির্দিষ্ট — কোনো ছবি আপলোড ছাড়াই দেখানো হচ্ছে।'
              : 'This result is hardcoded — shown without uploading any image.'}
          </p>
        </div>
      </motion.div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
          <ClipboardList className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 md:text-2xl">
            {lang === 'bn'
              ? '📋 স্ক্রিপ্টগার্ড — ডেমো ফলাফল'
              : '📋 ScriptGuard — Demo Result'}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {lang === 'bn'
              ? '৩টি ওষুধ (নাপা, সেকলো, অ্যাজিম্যাক্স) এবং ১টি হালকা মিথস্ক্রিয়া সহ।'
              : '3 drugs (Napa, Seclo, Azimax) with 1 mild interaction.'}
          </p>
        </div>
      </div>

      {/* Interaction lang toggle (demo-only convenience) */}
      <button
        type="button"
        onClick={toggleInteractionLang}
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        <AlertCircle className="h-3 w-3" />
        {lang === 'bn'
          ? `মিথস্ক্রিয়া ভাষা: ${showBnInteraction ? 'বাংলা' : 'English'}`
          : `Interaction text: ${showBnInteraction ? 'বাংলা' : 'English'}`}
      </button>

      {/* 1. Drug interactions */}
      <DrugInteractionAlert
        interactions={DEMO_RESULT.interaction_warnings}
        hasDangerous={DEMO_RESULT.has_dangerous_interactions}
        lang={demoInteractionLang}
      />

      {/* 2. Extracted medications */}
      <ResultCard
        title={lang === 'bn' ? 'শনাক্তকৃত ওষুধ' : 'Identified Medications'}
        badge={{
          label: `${DEMO_DRUGS.length} ${lang === 'bn' ? 'টি' : 'drugs'}`,
          variant: 'normal',
        }}
      >
        <div className="pt-3">
          <ExtractedMedsTable drugs={DEMO_DRUGS} lang={lang} />
        </div>
      </ResultCard>

      {/* 3. Medication schedule timeline */}
      <ResultCard
        title={lang === 'bn' ? 'ওষুধ গ্রহণের সময়সূচি' : 'Medication Schedule'}
        badge={{ label: lang === 'bn' ? 'প্রতিদিন' : 'Daily', variant: 'low' }}
      >
        <div className="pt-3">
          <MedicationScheduleTimeline
            schedule={DEMO_SCHEDULE}
            durationDays={DEMO_RESULT.duration_days}
            specialInstructions={specialInstructions}
            lang={lang}
          />
        </div>
      </ResultCard>

      {/* 4. Audio guide */}
      <AudioGuide audioScriptBn={DEMO_AUDIO_SCRIPT_BN} lang={lang} />

      {/* Demo note */}
      <p className="text-center text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
        {lang === 'bn'
          ? 'বাংলা অডিও প্লে করতে নিচের বাটনে চাপুন — সেরা অভিজ্ঞতার জন্য Android-এ Chrome ব্যবহার করুন।'
          : 'Tap Play below to hear the Bengali audio — for best TTS, use Chrome on Android.'}
      </p>
    </div>
    </div>
    </>
  )
}
