'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, FileText, Utensils, ArrowRight, LogIn, Sparkles } from 'lucide-react'

const demos = [
  {
    href: '/demo/nayan-ai',
    icon: Eye,
    gradient: 'from-sky-500 to-cyan-500',
    shadow: 'shadow-sky-500/25',
    titleEn: 'Nayan AI',
    titleBn: 'নয়ান AI',
    descEn: 'Eye screening — cataract & retinopathy triage',
    descBn: 'চোখের পরীক্ষা — ছানি ও রেটিনার ঝুঁকি নির্ণয়',
  },
  {
    href: '/demo/scriptguard',
    icon: FileText,
    gradient: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/25',
    titleEn: 'ScriptGuard',
    titleBn: 'স্ক্রিপ্টগার্ড',
    descEn: 'Prescription reader — interactions & schedule',
    descBn: 'প্রেসক্রিপশন বিশ্লেষণ — মিথস্ক্রিয়া ও সময়সূচি',
  },
  {
    href: '/demo/glycovision',
    icon: Utensils,
    gradient: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/25',
    titleEn: 'GlycoVision',
    titleBn: 'গ্লাইকোভিশন',
    descEn: 'Meal analysis — calories, carbs & disease risk',
    descBn: 'খাদ্য বিশ্লেষণ — ক্যালোরি, কার্ব ও রোগের ঝুঁকি',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 24 } },
}

export default function DemoPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-br from-gray-50 via-sky-50/40 to-emerald-50/30 dark:from-gray-950 dark:via-sky-950/30 dark:to-emerald-950/20 animate-gradient-bg motion-reduce:animate-none" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -left-32 top-10 h-[600px] w-[600px] rounded-full bg-sky-300/40 dark:bg-sky-500/15 blur-[140px] motion-reduce:hidden animate-float-1" />
        <div className="absolute -right-32 bottom-10 h-[600px] w-[600px] rounded-full bg-emerald-300/35 dark:bg-emerald-500/15 blur-[140px] motion-reduce:hidden animate-float-2" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-3xl px-4 py-14 md:py-20"
      >
        {/* Brand header */}
        <motion.div variants={item} className="text-center mb-10">
          <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 flex items-center justify-center shadow-xl shadow-sky-500/25">
            <span className="text-white text-2xl font-black">S</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100/80 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3" />
            Demo Mode — no sign-in needed
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-gray-100">
            ShasthyaHub-AI
          </h1>
          <p className="mt-2 text-base font-bengali text-gray-500 dark:text-gray-400">
            স্বাস্থ্যসেবা, সবার জন্য — তিনটি AI এজেন্ট এক অ্যাপে
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Three AI health agents — try each one with sample data below.
          </p>
        </motion.div>

        {/* Demo cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {demos.map((demo) => {
            const Icon = demo.icon
            return (
              <motion.div key={demo.href} variants={item}>
                <Link
                  href={demo.href}
                  className="group relative flex h-full flex-col rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/85 dark:bg-gray-900/85 backdrop-blur-sm p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(14,165,233,0.15)] dark:hover:shadow-[0_20px_50px_rgba(14,165,233,0.2)] hover:border-sky-300/60 dark:hover:border-sky-700/60"
                >
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${demo.gradient} shadow-lg ${demo.shadow} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-5.5 w-5.5 text-white" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {demo.titleEn}
                    <span className="ml-1.5 font-bengali text-sm font-medium text-gray-400 dark:text-gray-500">
                      {demo.titleBn}
                    </span>
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {demo.descEn}
                  </p>
                  <p className="mt-0.5 text-xs font-bengali leading-relaxed text-gray-400 dark:text-gray-500">
                    {demo.descBn}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400">
                    Try demo / ডেমো দেখুন
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Footer CTA */}
        <motion.div variants={item} className="mt-10 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-[length:200%_100%] animate-gradient-x px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all"
          >
            <LogIn className="h-4 w-4" />
            Sign in for the full app / লগইন করুন
          </Link>
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 max-w-sm mx-auto leading-relaxed">
            Demos use sample data — no camera, account, or internet AI calls required.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}