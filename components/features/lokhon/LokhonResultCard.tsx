'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Stethoscope, Lightbulb, HeartPulse, Phone, Heart } from 'lucide-react'
import type { LokhonResult } from '@/types'
import { ResultCard } from '@/components/shared/ResultCard'
import { RiskGauge } from './RiskGauge'

interface LokhonResultCardProps {
  result: LokhonResult
  lang: 'en' | 'bn'
}

export function LokhonResultCard({ result, lang }: LokhonResultCardProps) {
  if (result.requiresImmediateSupport) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40 p-6 text-center"
        >
          <Heart className="h-10 w-10 mx-auto mb-3 text-rose-500" />
          <h2 className="text-base font-bold text-rose-700 dark:text-rose-300 mb-2">
            {lang === 'bn' ? 'আপনি একা নন — সাহায্য পাওয়া যায়' : 'You Are Not Alone — Help Is Available'}
          </h2>
          <p className="text-sm leading-relaxed text-rose-600 dark:text-rose-400 mb-4">
            {lang === 'bn' ? result.crisisResources?.messageBn : result.crisisResources?.messageEn}
          </p>
          <div className="inline-flex items-center gap-2 rounded-xl bg-rose-100 dark:bg-rose-900/50 px-5 py-3">
            <Phone className="h-5 w-5 text-rose-500" />
            <span className="text-lg font-black text-rose-700 dark:text-rose-300 tracking-wider">
              {result.crisisResources?.helpline ?? '16463'}
            </span>
          </div>
        </motion.div>

        <ResultCard title={lang === 'bn' ? 'পরামর্শ' : 'Recommendations'}>
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {lang === 'bn' ? result.advice.advice_bn : result.advice.advice_en}
            </p>
          </div>
        </ResultCard>

        <p className="text-center text-[10px] leading-relaxed text-gray-400 dark:text-gray-500 max-w-lg mx-auto">
          {lang === 'bn'
            ? 'এই টুল পেশাদার রোগ নির্ণয়ের বিকল্প নয়। জরুরি অবস্থায় ১৬৪৬৩ নম্বরে কল করুন।'
            : 'This tool does not replace professional diagnosis. In an emergency call 16463.'}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Red flag emergency banner */}
      {result.isRedFlag && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40 p-5 text-center"
        >
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <p className="text-sm font-bold text-red-700 dark:text-red-300">
            {lang === 'bn'
              ? 'আপনার কিছু গুরুতর লক্ষণ শনাক্ত হয়েছে — অবিলম্বে চিকিৎসা সেবা নিন'
              : 'You have flagged serious symptoms — seek medical care immediately'}
          </p>
        </motion.div>
      )}

      {/* Risk gauge — hidden for mental health */}
      {result.diseaseSlug !== 'depression' && (
        <div className="flex justify-center py-4">
          <RiskGauge
            percentage={result.riskPercentage}
            band={result.riskBand}
            lang={lang}
          />
        </div>
      )}

      {/* Mental health banner */}
      {result.diseaseSlug === 'depression' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-5 text-center"
        >
          <Heart className="h-8 w-8 mx-auto mb-2 text-rose-400" />
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
            {lang === 'bn'
              ? 'আপনার উত্তরগুলি ইঙ্গিত দেয় যে একজন কাউন্সেলরের সাথে কথা বলা সহায়ক হতে পারে'
              : 'Your responses suggest it could help to talk to a counselor'}
          </p>
        </motion.div>
      )}

      {/* Advice card */}
      <ResultCard
        title={lang === 'bn' ? 'পরামর্শ' : 'Recommendations'}
        badge={{
          label: lang === 'bn'
            ? result.riskBand === 'Urgent' ? 'জরুরি' : result.riskBand === 'High' ? 'উচ্চ ঝুঁকি' : result.riskBand === 'Moderate' ? 'মাঝারি' : 'স্বাভাবিক'
            : result.riskBand,
          variant: result.riskBand === 'Urgent' || result.riskBand === 'High' ? 'destructive' : 'secondary',
        }}
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {lang === 'bn' ? result.advice.advice_bn : result.advice.advice_en}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Stethoscope className="h-5 w-5 shrink-0 mt-0.5 text-sky-500" />
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {lang === 'bn' ? result.advice.doctor_type_bn : result.advice.doctor_type_en}
            </p>
          </div>
        </div>
      </ResultCard>

      {/* Top symptoms */}
      {result.topSymptoms.length > 0 && (
        <ResultCard title={lang === 'bn' ? 'আপনার চিহ্নিত প্রধান লক্ষণ' : 'Top Symptoms You Flagged'}>
          <ul className="space-y-2">
            {result.topSymptoms.map((symptom, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <HeartPulse className="h-4 w-4 shrink-0 mt-0.5 text-sky-500" />
                <span>{lang === 'bn' ? symptom.text_bn : symptom.text_en}</span>
              </li>
            ))}
          </ul>
        </ResultCard>
      )}

      {/* Disclaimer */}
      <p className="text-center text-[10px] leading-relaxed text-gray-400 dark:text-gray-500 max-w-lg mx-auto">
        {lang === 'bn'
          ? 'এই টুল পেশাদার রোগ নির্ণয়ের বিকল্প নয়। সঠিক মূল্যায়নের জন্য একজন ডাক্তারের পরামর্শ নিন।'
          : 'This tool does not replace professional diagnosis. Please consult a doctor for proper evaluation.'}
      </p>
    </motion.div>
  )
}
