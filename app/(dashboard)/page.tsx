'use client'

import Link from 'next/link'
import { Eye, FileText, Utensils, Activity, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'

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

const recentAnalyses = [
  { type: 'eye', labelEn: 'Eye Checkup', labelBn: 'চোখের পরীক্ষা', date: 'Today', status: 'Complete' },
  { type: 'food', labelEn: 'Meal Analysis', labelBn: 'খাদ্য বিশ্লেষণ', date: 'Yesterday', status: 'Complete' },
]

export default function DashboardHome() {
  const { lang } = useLanguage()
  const { profile } = useAuth()

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
      className="max-w-4xl mx-auto p-4 md:p-6 space-y-6"
    >
      {/* Greeting */}
      <motion.div variants={fadeUp}>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">{greeting}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tagline}</p>
      </motion.div>

      {/* Health Quick Summary */}
      <motion.div variants={fadeUp} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-700 p-5 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {lang === 'bn' ? 'আজকের স্বাস্থ্য সারাংশ' : 'Today\'s Health Summary'}
          </h2>
          <Activity className="h-5 w-5 text-sky-500" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '--', labelEn: 'Analyses Done', labelBn: 'বিশ্লেষণ সম্পন্ন' },
            { value: '--', labelEn: 'Risk Flags', labelBn: 'ঝুঁকির সতর্কতা' },
            { value: '--', labelEn: 'Drugs Checked', labelBn: 'ওষুধ পরীক্ষিত' },
            { value: '--', labelEn: 'Meals Logged', labelBn: 'খাবার যোগ করা' },
          ].map((stat) => (
            <div key={stat.labelEn} className="text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{lang === 'bn' ? stat.labelBn : stat.labelEn}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Feature Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Link key={feature.href} href={feature.href}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md dark:hover:shadow-none transition-shadow group cursor-pointer">
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

      {/* Recent Analyses */}
      <motion.div variants={fadeUp} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-700 p-5 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {lang === 'bn' ? 'সাম্প্রতিক বিশ্লেষণ' : 'Recent Analyses'}
          </h2>
          <Link href="/reports" className="text-xs text-sky-600 dark:text-sky-400 font-medium hover:underline">
            {lang === 'bn' ? 'সব দেখুন' : 'View All'}
          </Link>
        </div>

        {recentAnalyses.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {lang === 'bn' ? 'এখনো কোনো বিশ্লেষণ নেই' : 'No analyses yet'}
            </p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
              {lang === 'bn' ? 'উপরে থেকে একটি ফিচার বেছে নিন' : 'Pick a feature above to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAnalyses.map((item) => (
              <div
                key={`${item.type}-${item.date}`}
                className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/50 rounded-lg flex items-center justify-center">
                    <Activity className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {lang === 'bn' ? item.labelBn : item.labelEn}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{item.date}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Disclaimers */}
      <motion.div variants={fadeUp} className="bg-amber-50 dark:bg-amber-900/30 rounded-2xl border border-amber-100 dark:border-amber-800 p-4">
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          {lang === 'bn'
            ? '⚠️ এই AI সরঞ্জামটি শুধুমাত্র তথ্যগত উদ্দেশ্যে। এটি পেশাদার চিকিৎসকের পরামর্শের বিকল্প নয়। জরুরি অবস্থায় নিকটস্থ হাসপাতালে যোগাযোগ করুন।'
            : '⚠️ This AI tool is for informational purposes only. Not a substitute for professional medical advice. In emergencies, contact your nearest hospital.'}
        </p>
      </motion.div>
    </motion.div>
  )
}
