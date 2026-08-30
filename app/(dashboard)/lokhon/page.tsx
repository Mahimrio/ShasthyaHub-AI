'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Search, Shield } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { DiseaseCard } from '@/components/features/lokhon/DiseaseCard'
import type { LokhonDisease } from '@/types'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export default function LokhonPage() {
  const { lang } = useLanguage()
  const [diseases, setDiseases] = useState<LokhonDisease[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/lokhon/diseases')
        const json = await res.json()
        if (json.success && json.data?.diseases) {
          setDiseases(json.data.diseases)
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) fetchData()
    }
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
  }, [])

  return (
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-rose-50/60 via-amber-50/30 to-orange-50/50 dark:from-gray-950 dark:via-rose-950/30 dark:to-amber-950/20 animate-gradient-bg z-0 motion-reduce:animate-none">
        <div className="absolute -left-32 top-10 h-[700px] w-[700px] rounded-full bg-rose-300/40 dark:bg-rose-500/20 blur-[140px] motion-reduce:hidden animate-float-1" />
        <div className="absolute -right-32 top-40 h-[700px] w-[700px] rounded-full bg-amber-300/35 dark:bg-amber-500/20 blur-[140px] motion-reduce:hidden animate-float-2" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[500px] w-[800px] rounded-full bg-orange-200/25 dark:bg-orange-600/15 blur-[160px] motion-reduce:hidden animate-float-3" />
      </div>

      <div className="relative min-h-screen z-10">
        <div className="relative mx-auto max-w-4xl space-y-6 p-4 md:p-6">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-500">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 md:text-2xl">
                {lang === 'bn' ? 'লক্ষণ পরীক্ষা — লোকন' : 'Lokhon — Symptom Checker'}
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {lang === 'bn'
                  ? 'কয়েকটি সহজ প্রশ্নের উত্তর দিন এবং আপনার ঝুঁকি সম্পর্কে জানুন। এটি রোগ নির্ণয় নয় — শুধুমাত্র সচেতনতা বৃদ্ধির একটি টুল।'
                  : 'Answer a few simple questions to learn about your health risks. This is not a diagnosis — it is an awareness tool.'}
              </p>
            </div>
          </div>

          {/* Disclaimer banner */}
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-4">
            <Shield className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />
            <div className="text-xs leading-relaxed text-rose-700 dark:text-rose-300">
              <p className="font-semibold mb-1">
                {lang === 'bn'
                  ? 'এটি একটি চিকিৎসা নির্ণয়ের টুল নয়'
                  : 'This is NOT a diagnostic tool'}
              </p>
              <p>
                {lang === 'bn'
                  ? 'লোকন শুধুমাত্র সচেতনতা বৃদ্ধির জন্য। জরুরি অবস্থায় সরাসরি হাসপাতালে যান। সঠিক রোগ নির্ণয়ের জন্য সর্বদা একজন নিবন্ধিত চিকিৎসকের পরামর্শ নিন।'
                  : 'Lokhon is an awareness tool only. In an emergency, go to the nearest hospital. Always consult a registered doctor for proper diagnosis.'}
              </p>
            </div>
          </div>

          {/* Disease grid */}
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-2xl border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                />
              ))}
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {diseases.map((disease) => (
                <motion.div key={disease.slug} variants={item}>
                  <DiseaseCard disease={disease} lang={lang} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Empty state */}
          {!loading && diseases.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 dark:backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/60 p-10 text-center"
            >
              <Search className="h-8 w-8 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-500">
                {lang === 'bn' ? 'কোনো রোগের তথ্য পাওয়া যায়নি' : 'No screening modules available'}
              </p>
            </motion.div>
          )}

          {/* Bottom disclaimer */}
          <p className="text-center text-[10px] leading-relaxed text-gray-400 dark:text-gray-500 max-w-3xl mx-auto border-t border-gray-50 pt-6 dark:border-gray-800/40">
            {lang === 'bn'
              ? 'সতর্কীকরণ: লোকন একটি AI স্ক্রিনিং টুল, ক্লিনিকাল রোগ নির্ণয় নয়। স্বাস্থ্য সংক্রান্ত সিদ্ধান্ত নেওয়ার আগে সর্বদা একজন যোগ্য চিকিৎসকের পরামর্শ নিন।'
              : 'DISCLAIMER: Lokhon is an AI screening tool, not a clinical diagnosis. Always consult a qualified medical professional before making health decisions.'}
          </p>
        </div>
      </div>
    </>
  )
}
