'use client'

import Link from 'next/link'
import { Eye, FileText, Utensils, ChevronRight, Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'

interface HealthScoreData {
  score: number | null
  eye_score: number | null
  food_score: number | null
  rx_score: number | null
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
}

const features = [
  {
    href: '/nayan-ai',
    icon: Eye,
    gradient: 'from-sky-500 to-cyan-500',
    titleEn: 'Nayan AI',
    titleBn: 'নয়ান AI',
    descEn: 'Diabetic Retinopathy Detection',
    descBn: 'ডায়াবেটিক রেটিনোপ্যাথি নির্ণয়',
  },
  {
    href: '/scriptguard',
    icon: FileText,
    gradient: 'from-emerald-500 to-teal-500',
    titleEn: 'ScriptGuard',
    titleBn: 'স্ক্রিপ্টগার্ড',
    descEn: 'Prescription Analyzer',
    descBn: 'প্রেসক্রিপশন বিশ্লেষক',
  },
  {
    href: '/glycovision',
    icon: Utensils,
    gradient: 'from-amber-500 to-orange-500',
    titleEn: 'GlycoVision',
    titleBn: 'গ্লাইকোভিশন',
    descEn: 'Food & Glucose Tracker',
    descBn: 'খাদ্য ও গ্লুকোজ ট্র্যাকার',
  },
]

function getScoreColor(val: number) {
  if (val <= 40) return '#EF4444'
  if (val <= 70) return '#EAB308'
  return '#10B981'
}

export default function DashboardHome() {
  const { lang } = useLanguage()
  const { profile } = useAuth()

  const { data: healthData, isLoading: healthLoading, isError: healthError } = useQuery<{ success: boolean; data: HealthScoreData }>({
    queryKey: ['healthScore'],
    queryFn: async () => {
      const res = await fetch('/api/reports/health-score')
      if (!res.ok) throw new Error('Failed to fetch health score')
      return res.json()
    },
    refetchInterval: 30_000,
    retry: 2,
    staleTime: 15_000,
  })

  const hs = healthData?.data
  const score = hs?.score ?? null

  const greeting = lang === 'bn'
    ? `স্বাগতম, ${profile?.name || 'ব্যবহারকারী'} 👋`
    : `Welcome back, ${profile?.name || 'User'} 👋`

  const tagline = lang === 'bn'
    ? 'আপনার স্বাস্থ্য সহায়ক — যেকোনো সময়, যেকোনো স্থানে'
    : 'Your health companion — anytime, anywhere'

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={stagger}
      className="relative min-h-screen z-10"
    >
      {/* Dynamic Animated Fixed Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-gray-50 via-sky-50/30 to-emerald-50/20 dark:from-gray-950 dark:via-sky-950/30 dark:to-emerald-950/20 animate-gradient-bg z-0 motion-reduce:animate-none motion-reduce:bg-gray-50 motion-reduce:dark:bg-gray-950" />
      
      {/* Ambient Radial Gradient Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -left-32 top-10 h-[700px] w-[700px] rounded-full bg-sky-300/40 dark:bg-sky-500/20 blur-[140px] motion-reduce:hidden animate-float-1" />
        <div className="absolute -right-32 top-40 h-[700px] w-[700px] rounded-full bg-emerald-300/35 dark:bg-emerald-500/20 blur-[140px] motion-reduce:hidden animate-float-2" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[500px] w-[800px] rounded-full bg-cyan-200/25 dark:bg-cyan-600/15 blur-[160px] motion-reduce:hidden animate-float-3" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Greeting */}
      <motion.div variants={fadeUp}>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">{greeting}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tagline}</p>
      </motion.div>

      {/* Health Score Gauge */}
      <motion.div variants={fadeUp} className="bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 dark:backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/60 p-5 transition-all duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(14,165,233,0.06)] hover:shadow-[0_20px_60px_rgba(14,165,233,0.12),0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4),0_4px_12px_rgba(14,165,233,0.08)] dark:hover:shadow-[0_20px_60px_rgba(14,165,233,0.15),0_8px_24px_rgba(0,0,0,0.5)]">
        {healthLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : healthError || score === null ? (
          <div className="text-center py-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {lang === 'bn' ? 'আপনার প্রথম স্কোর তৈরি করুন 🎯' : 'Get Your First Score 🎯'}
            </h2>
            <div className="flex gap-3 justify-center flex-wrap">
              {features.map((f) => {
                const Icon = f.icon
                return (
                  <Link
                    key={f.href}
                    href={f.href}
                    className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-br ${f.gradient} text-white rounded-xl text-xs font-medium hover:opacity-90 transition-opacity`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {lang === 'bn' ? f.titleBn : f.titleEn}
                  </Link>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-6 flex-col sm:flex-row">
            {/* Gauge */}
            <div className="relative flex flex-col items-center shrink-0">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle cx="56" cy="56" r="44" stroke="#F3F4F6" strokeWidth="8" fill="transparent" className="dark:stroke-gray-700" />
                <circle
                  cx="56" cy="56" r="44"
                  stroke={getScoreColor(score)}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="276.46"
                  strokeDashoffset={276.46 - (276.46 * score) / 100}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold" style={{ color: getScoreColor(score) }}>{score}</span>
                <span className="text-[9px] text-gray-400 font-medium tracking-wide uppercase mt-0.5">
                  {lang === 'bn' ? 'স্বাস্থ্য স্কোর' : 'Health Score'}
                </span>
              </div>
            </div>

            {/* Mini cards */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                  {lang === 'bn' ? 'চোখ' : 'Eye'}
                </p>
                <p className="text-xl font-bold text-sky-600 mt-1">{hs?.eye_score ?? '--'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                  {lang === 'bn' ? 'প্রেসক্রিপশন' : 'Prescription'}
                </p>
                <p className="text-xl font-bold text-emerald-600 mt-1">{hs?.rx_score ?? '--'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                  {lang === 'bn' ? 'খাদ্য' : 'Food'}
                </p>
                <p className="text-xl font-bold text-amber-600 mt-1">{hs?.food_score ?? '--'}</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Feature Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Link key={feature.href} href={feature.href}>
              <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 dark:backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/60 p-5 transition-all duration-300 group cursor-pointer shadow-[0_10px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(14,165,233,0.06)] hover:shadow-[0_20px_60px_rgba(14,165,233,0.12),0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4),0_4px_12px_rgba(14,165,233,0.08)] dark:hover:shadow-[0_20px_60px_rgba(14,165,233,0.15),0_8px_24px_rgba(0,0,0,0.5)]">
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-base">
                  {lang === 'bn' ? feature.titleBn : feature.titleEn}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {lang === 'bn' ? feature.descBn : feature.descEn}
                </p>
                <div className="flex items-center gap-1 mt-3 text-sky-600 dark:text-sky-400 text-xs font-medium group-hover:gap-2 transition-all">
                  <span>{lang === 'bn' ? 'শুরু করুন' : 'Get Started'}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          )
        })}
      </motion.div>

      {/* Disclaimers */}
      <motion.div variants={fadeUp} className="bg-amber-50 dark:bg-amber-900/30 rounded-2xl border border-amber-100 dark:border-amber-800 p-4">
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          {lang === 'bn'
            ? '⚠️ এই AI সরঞ্জামটি শুধুমাত্র তথ্যগত উদ্দেশ্যে। এটি পেশাদার চিকিৎসকের পরামর্শের বিকল্প নয়। জরুরি অবস্থায় নিকটস্থ হাসপাতালে যোগাযোগ করুন।'
            : '⚠️ This AI tool is for informational purposes only. Not a substitute for professional medical advice. In emergencies, contact your nearest hospital.'}
        </p>
      </motion.div>
    </div>
    </motion.div>
  )
}
