'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FileText, AlertTriangle, Clock } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { DisclaimerModal } from '@/components/shared/DisclaimerModal'
import { AiThinkingBanner } from '@/components/shared/AiThinkingBanner'
import { ResultCard } from '@/components/shared/ResultCard'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type AnalysisState = 'idle' | 'disclaimer' | 'uploading' | 'processing' | 'complete'

interface DrugInfo {
  written: string
  brand: string
  generic: string
  dosage: string
  frequency: string
  confidence: 'high' | 'medium' | 'low'
}

interface InteractionWarning {
  drugs: [string, string]
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical'
  riskEn: string
  riskBn: string
}

export default function ScriptGuardPage() {
  const { lang } = useLanguage()
  const [state, setState] = useState<AnalysisState>('disclaimer')
  const [showDisclaimer, setShowDisclaimer] = useState(true)

  const [drugs] = useState<DrugInfo[]>([
    { written: 'Metformin 500mg', brand: 'Emet', generic: 'Metformin HCl', dosage: '500mg', frequency: '1+0+1', confidence: 'high' },
    { written: 'Glibenclamide 5mg', brand: 'Daonil', generic: 'Glibenclamide', dosage: '5mg', frequency: '1+0+0', confidence: 'high' },
    { written: 'Amlodipine 10mg', brand: 'Amlopin', generic: 'Amlodipine Besylate', dosage: '10mg', frequency: '0+0+1', confidence: 'medium' },
  ])

  const [interactions] = useState<InteractionWarning[]>([
    { drugs: ['Metformin', 'Glibenclamide'], severity: 'Moderate', riskEn: 'Increased risk of hypoglycemia. Monitor blood sugar closely.', riskBn: 'হাইপোগ্লাইসেমিয়ার ঝুঁকি বাড়তে পারে। নিয়মিত ব্লাড সুগার মনিটর করুন।' },
  ])

  const hasCriticalInteraction = interactions.some((i) => i.severity === 'Critical' || i.severity === 'Severe')

  const handleAcceptDisclaimer = useCallback(() => {
    setShowDisclaimer(false)
    setState('idle')
  }, [])

  const handleImageSelect = useCallback((_file: File) => {
    setState('processing')
    setTimeout(() => setState('complete'), 3000)
  }, [])

  const confidenceBadge = (c: DrugInfo['confidence']): 'green' | 'yellow' | 'red' => {
    switch (c) {
      case 'high': return 'green'
      case 'medium': return 'yellow'
      case 'low': return 'red'
    }
  }

  const confidenceLabel = (c: DrugInfo['confidence']): string => {
    if (lang === 'bn') {
      return c === 'high' ? 'নিশ্চিত' : c === 'medium' ? 'মোটামুটি' : 'অনিশ্চিত'
    }
    return c === 'high' ? 'High' : c === 'medium' ? 'Medium' : 'Low'
  }

  return (
    <>
      <DisclaimerModal
        open={showDisclaimer}
        onOpenChange={setShowDisclaimer}
        onAccept={handleAcceptDisclaimer}
      />

      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
              {lang === 'bn' ? 'স্ক্রিপ্টগার্ড — প্রেসক্রিপশন বিশ্লেষক' : 'ScriptGuard — Prescription Analyzer'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              {lang === 'bn'
                ? 'আপনার প্রেসক্রিপশনের ছবি আপলোড করুন। AI ওষুধ চিহ্নিত করবে, মিথস্ক্রিয়া যাচাই করবে এবং ডিজিটাল শিডিউল তৈরি করবে।'
                : 'Upload a photo of your prescription to identify drugs, check interactions, and generate a digital schedule.'}
            </p>
          </div>
        </div>

        {/* Upload */}
        {state !== 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <ImageUploader
              onImageSelect={handleImageSelect}
              acceptedTypes="image/*"
              maxSizeMB={10}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
              {lang === 'bn'
                ? 'প্রেসক্রিপশনটি সমতল পৃষ্ঠে রেখে ছবি তুলুন, আলো যেন পর্যাপ্ত থাকে'
                : 'Place prescription on a flat surface with good lighting'}
            </p>
          </motion.div>
        )}

        {/* Processing */}
        {state === 'processing' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AiThinkingBanner />
          </motion.div>
        )}

        {/* Results */}
        {state === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Critical interaction override */}
            {hasCriticalInteraction && (
              <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-900/30 rounded-2xl">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <AlertTitle className="text-red-800 dark:text-red-200 font-bold text-base">
                  🚨 {lang === 'bn' ? 'গুরুতর ওষুধ মিথস্ক্রিয়া' : 'Critical Drug Interaction'}
                </AlertTitle>
                <AlertDescription className="text-red-700 dark:text-red-300 text-sm">
                  {lang === 'bn'
                    ? 'এই ওষুধগুলো একসাথে না খাওয়ার পরামর্শ দেওয়া হচ্ছে। দয়া করে একজন চিকিৎসকের পরামর্শ নিন।'
                    : 'Do NOT take these drugs together without consulting a doctor.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Drug list */}
            <ResultCard
              title={lang === 'bn' ? 'শনাক্তকৃত ওষুধ' : 'Identified Drugs'}
              badge={{ label: `${drugs.length} drugs`, variant: 'default' }}
            >
              <div className="space-y-2">
                {drugs.map((drug, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{drug.brand}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{drug.generic} — {drug.dosage}, {drug.frequency}</p>
                      <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-0.5">&ldquo;{drug.written}&rdquo;</p>
                    </div>
                    <Badge variant={confidenceBadge(drug.confidence)} className="ml-3 shrink-0">
                      {confidenceLabel(drug.confidence)}
                    </Badge>
                  </div>
                ))}
              </div>
            </ResultCard>

            {/* Interaction warnings */}
            {interactions.length > 0 && (
              <ResultCard
                title={lang === 'bn' ? 'ওষুধ মিথস্ক্রিয়া' : 'Drug Interactions'}
                badge={{ label: `${interactions.length} found`, variant: interactions.some(i => i.severity === 'Critical') ? 'critical' : 'medium' }}
              >
                <div className="space-y-3">
                  {interactions.map((interaction, i) => {
                    const severityStyles = {
                      Critical: 'border-red-500 bg-red-50 dark:bg-red-900/30',
                      Severe: 'border-orange-500 bg-orange-50 dark:bg-orange-900/30',
                      Moderate: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30',
                      Mild: 'border-blue-500 bg-blue-50 dark:bg-blue-900/30',
                    }
                    return (
                      <div
                        key={i}
                        className={`border-l-4 rounded-r-lg pl-3 py-2.5 ${severityStyles[interaction.severity]}`}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            interaction.severity === 'Critical' ? 'critical' :
                            interaction.severity === 'Severe' ? 'high' :
                            interaction.severity === 'Moderate' ? 'medium' : 'low'
                          }>
                            {interaction.severity}
                          </Badge>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {interaction.drugs[0]} + {interaction.drugs[1]}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                          {lang === 'bn' ? interaction.riskBn : interaction.riskEn}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </ResultCard>
            )}

            {/* Digital Schedule */}
            <ResultCard
              title={lang === 'bn' ? 'ডিজিটাল শিডিউল' : 'Digital Schedule'}
              badge={{ label: lang === 'bn' ? '৭ দিন' : '7 days', variant: 'green' }}
            >
              <div className="space-y-4">
                {([['Morning', 'সকাল'], ['Afternoon', 'দুপুর'], ['Evening', 'বিকাল'], ['Night', 'রাত']] as const).map(([periodEn, periodBn]) => {
                  const filtered = drugs.filter((_, i) => {
                    const map = [['1+0+1', '0+0+1', '1+0+0'], ['0+0+1'], ['0+0+1', '1+0+1'], ['0+0+1', '1+0+1']]
                    return map[i]?.includes(periodEn === 'Morning' ? '1' : periodEn === 'Evening' ? '1' : '1') ?? false
                  })
                  return (
                    <div key={periodEn}>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {lang === 'bn' ? periodBn : periodEn}
                        </span>
                      </div>
                      {filtered.length === 0 ? (
                        <p className="text-xs text-gray-300 dark:text-gray-600 pl-5">
                          {lang === 'bn' ? 'কোন ওষুধ নেই' : 'No medication'}
                        </p>
                      ) : (
                        filtered.map((drug, j) => (
                          <div key={j} className="flex items-center gap-3 pl-5 py-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">{drug.brand} — {drug.dosage}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )
                })}
              </div>
            </ResultCard>

            {/* Re-upload */}
            <Button
              onClick={() => setState('idle')}
              variant="outline"
              className="w-full rounded-xl"
            >
              {lang === 'bn' ? 'নতুন প্রেসক্রিপশন আপলোড করুন' : 'Upload New Prescription'}
            </Button>
          </motion.div>
        )}

        {/* Bottom disclaimer */}
        {state !== 'disclaimer' && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed text-center">
            {lang === 'bn'
              ? 'ShasthyaHub-AI একটি AI স্ক্রিনিং টুল, ক্লিনিকাল রোগ নির্ণয় নয়। স্বাস্থ্য সংক্রান্ত সিদ্ধান্ত নেওয়ার আগে সর্বদা একজন যোগ্য চিকিৎসকের পরামর্শ নিন।'
              : 'ShasthyaHub-AI is an AI screening tool, not a clinical diagnosis. Always consult a qualified medical professional before making health decisions.'}
          </p>
        )}
      </div>
    </>
  )
}
