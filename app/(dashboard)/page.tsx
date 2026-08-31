'use client'

import Link from 'next/link'
import { Eye, FileText, Utensils, Activity, ChevronRight, Loader2, RotateCcw, Target, Wifi, WifiOff } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { motion, useReducedMotion } from 'framer-motion'
import { AnimatedCounter } from '@/components/shared/AnimatedCounter'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { DailyHealthTip } from '@/components/dashboard/DailyHealthTip'
import { EmergencyStrip } from '@/components/dashboard/EmergencyStrip'
import { CapabilityStrip } from '@/components/dashboard/CapabilityStrip'

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
    tagEn: 'Offline ready',
    tagBn: 'অফলাইনেও চলে',
    tagClass: 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
    descBn: 'ডায়াবেটিক রেটিনোপ্যাথি নির্ণয়',
  },
  {
    href: '/scriptguard',
    icon: FileText,
    gradient: 'from-emerald-500 to-teal-500',
    titleEn: 'ScriptGuard',
    titleBn: 'স্ক্রিপ্টগার্ড',
    descEn: 'Prescription Analyzer',
    tagEn: '65+ BD drugs',
    tagBn: '৬৫+ দেশী ৓ষুধ',
    tagClass: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    descBn: 'প্রেসক্রিপশন বিশ্লেষক',
  },
  {
    href: '/glycovision',
    icon: Utensils,
    gradient: 'from-amber-500 to-orange-500',
    titleEn: 'GlycoVision',
    titleBn: 'গ্লাইকোভিশন',
    descEn: 'Food & Glucose Tracker',
    tagEn: '85+ BD foods',
    tagBn: '৮৫+ দেশী খাবার',
    tagClass: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    descBn: 'খাদ্য ও গ্লুকোজ ট্র্যাকার',
  },
  {
    href: '/lokhon',
    icon: Activity,
    gradient: 'from-rose-500 to-pink-500',
    titleEn: 'Lokhon',
    titleBn: 'লক্ষণ',
    descEn: 'Symptom Checker & Triage',
    descBn: 'লক্ষণ যাচাই ও ঝুঁকি নির্ণয়',
    tagEn: '2-min check',
    tagBn: '২ মিনিটে যাচাই',
    tagClass: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
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
  const { isOnline } = useNetworkStatus()

  const { data: healthData, isLoading: healthLoading, isError: healthError, refetch: refetchHealth } = useQuery<{ success: boolean; data: HealthScoreData }>({
    queryKey: ['healthScore'],
    queryFn: async ({ signal }) => {
      const timeoutAc = new AbortController()
      const timeoutId = setTimeout(() => timeoutAc.abort(), 8000)
      signal?.addEventListener('abort', () => timeoutAc.abort())
      try {
        const res = await fetch('/api/reports/health-score', { signal: timeoutAc.signal })
        if (!res.ok) throw new Error('Failed to fetch health score')
        return res.json()
      } finally {
        clearTimeout(timeoutId)
      }
    },
    refetchInterval: isOnline ? 30_000 : false,
    retry: !isOnline ? 0 : 2,
    staleTime: 15_000,
  })

  const hs = healthData?.data
  const score = hs?.score ?? null
  const reduceMotion = useReducedMotion()

  const miniStats = [
    {
      href: '/nayan-ai',
      icon: Eye,
      label: lang === 'bn' ? 'চোখ' : 'Eye',
      value: hs?.eye_score ?? null,
      hex: '#0EA5E9',
      text: 'text-sky-600 dark:text-sky-400',
      iconColor: 'text-sky-500',
      hoverBorder: 'hover:border-sky-200 dark:hover:border-sky-800/60',
    },
    {
      href: '/scriptguard',
      icon: FileText,
      label: lang === 'bn' ? 'প্রেসক্রিপশন' : 'Prescription',
      value: hs?.rx_score ?? null,
      hex: '#10B981',
      text: 'text-emerald-600 dark:text-emerald-400',
      iconColor: 'text-emerald-500',
      hoverBorder: 'hover:border-emerald-200 dark:hover:border-emerald-800/60',
    },
    {
      href: '/glycovision',
      icon: Utensils,
      label: lang === 'bn' ? 'খাদ্য' : 'Food',
      value: hs?.food_score ?? null,
      hex: '#F59E0B',
      text: 'text-amber-600 dark:text-amber-400',
      iconColor: 'text-amber-500',
      hoverBorder: 'hover:border-amber-200 dark:hover:border-amber-800/60',
    },
  ]

  const hour = new Date().getHours()
  const timeGreeting =
    hour < 5
      ? lang === 'bn' ? 'শুভ রাত্রি' : 'Good night'
      : hour < 12
        ? lang === 'bn' ? 'শুভ সকাল' : 'Good morning'
        : hour < 17
          ? lang === 'bn' ? 'শুভ অপরাহ্ন' : 'Good afternoon'
          : lang === 'bn' ? 'শুভ সন্ধ্যা' : 'Good evening'

  const firstName = (profile?.name || (lang === 'bn' ? 'ব্যবহারকারী' : 'User')).split(' ')[0]

  const tagline = lang === 'bn'
    ? 'আপনার স্বাস্থ্য সহায়ক — যেকোনো সময়, যেকোনো স্থানে'
    : 'Your health companion — anytime, anywhere'
  const todayLabel = new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const scoreLabel =
    score == null
      ? ''
      : score <= 40
        ? lang === 'bn' ? 'মনোযোগ প্রয়োজন' : 'Needs attention'
        : score <= 70
          ? lang === 'bn' ? 'মোটামুটি ভালো' : 'Fair'
          : lang === 'bn' ? 'চমৎকার' : 'Excellent'
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
      <motion.div variants={fadeUp} className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {timeGreeting} · {todayLabel}
          </p>
          <h1 className="mt-1.5 text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-gray-50">
            {lang === 'bn' ? 'স্বাগতম, ' : 'Welcome back, '}
            <span className="bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent dark:from-sky-400 dark:via-cyan-400 dark:to-emerald-400">
              {firstName}
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{tagline}</p>
        </div>
        <span
          className={`hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
              : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
          }`}
        >
          {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {isOnline
            ? lang === 'bn' ? 'অনলাইন · সম্পূর্ণ AI' : 'Online · Full AI'
            : lang === 'bn' ? 'অফলাইন মোড' : 'Offline mode'}
        </span>
      </motion.div>

      {/* Health Score Gauge */}
      <motion.div variants={fadeUp} className="bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 dark:backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/60 p-5 transition-all duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(14,165,233,0.06)] hover:shadow-[0_20px_60px_rgba(14,165,233,0.12),0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4),0_4px_12px_rgba(14,165,233,0.08)] dark:hover:shadow-[0_20px_60px_rgba(14,165,233,0.15),0_8px_24px_rgba(0,0,0,0.5)]">
        {healthLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : healthError ? (
          <div className="text-center py-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {lang === 'bn' ? 'স্কোর লোড করা যায়নি' : "Couldn't load your score"}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {lang === 'bn'
                ? 'ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন'
                : 'Check your connection and try again'}
            </p>
            <button
              onClick={() => refetchHealth()}
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
            </button>
          </div>
        ) : score === null ? (
          <div className="text-center py-4">
            <h2 className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <Target className="h-4 w-4 text-sky-500" />
              {lang === 'bn' ? 'আপনার প্রথম স্কোর তৈরি করুন' : 'Get Your First Score'}
            </h2>
            <div className="flex gap-3 justify-center flex-wrap">
              {features.map((f) => {
                const Icon = f.icon
                return (
                  <Link
                    key={f.href}
                    href={f.href}
                    className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-br ${f.gradient} text-white rounded-xl text-xs font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all`}
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
            <div className="flex flex-col items-center shrink-0">
              <div className="relative h-28 w-28">
                {/* Breathing glow behind the ring */}
                <motion.div
                  aria-hidden
                  className="absolute inset-0 rounded-full blur-xl"
                  style={{ backgroundColor: getScoreColor(score) }}
                  animate={reduceMotion ? { opacity: 0.14 } : { opacity: [0.1, 0.28, 0.1], scale: [0.9, 1.06, 0.9] }}
                  transition={{ duration: 3.2, repeat: reduceMotion ? 0 : Infinity, ease: 'easeInOut' }}
                />
                <svg className="relative w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="44" stroke="#F3F4F6" strokeWidth="8" fill="transparent" className="dark:stroke-gray-700" />
                  <motion.circle
                    cx="56" cy="56" r="44"
                    stroke={getScoreColor(score)}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="276.46"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 276.46 }}
                    animate={{ strokeDashoffset: 276.46 - (276.46 * score) / 100 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  />
                  {/* Dot marks the arc tip — exact trig position, fades in after the draw */}
                  {!reduceMotion && (
                    <motion.circle
                      cx={56 + 44 * Math.cos((score / 100) * 2 * Math.PI)}
                      cy={56 + 44 * Math.sin((score / 100) * 2 * Math.PI)}
                      r="5.5"
                      fill={getScoreColor(score)}
                      strokeWidth="2.5"
                      className="stroke-white dark:stroke-gray-900"
                      style={{ filter: `drop-shadow(0 0 4px ${getScoreColor(score)})` }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.25, duration: 0.35 }}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span style={{ color: getScoreColor(score) }}>
                    <AnimatedCounter value={score} className="text-2xl font-extrabold tabular-nums" />
                  </span>
                  <span className="text-[9px] text-gray-400 font-medium tracking-wide uppercase mt-0.5">
                    {lang === 'bn' ? 'স্বাস্থ্য স্কোর' : 'Health Score'}
                  </span>
                </div>
              </div>
              <motion.span
                initial={reduceMotion ? false : { opacity: 0, y: 4, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 1.15, type: 'spring', stiffness: 320, damping: 20 }}
                className="mt-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                style={{ color: getScoreColor(score), backgroundColor: `${getScoreColor(score)}1A` }}
              >
                {scoreLabel}
              </motion.span>
            </div>

            {/* Mini cards — tap through to each agent */}
            <div className="flex-1 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                {miniStats.map((s, i) => {
                  const SIcon = s.icon
                  return (
                    <motion.div
                      key={s.href}
                      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + i * 0.12, type: 'spring', stiffness: 260, damping: 22 }}
                    >
                      <Link
                        href={s.href}
                        className={`group block p-3 bg-gray-50 dark:bg-gray-800/60 border border-transparent dark:border-gray-700/40 rounded-xl text-center transition-all hover:-translate-y-0.5 hover:shadow-sm ${s.hoverBorder}`}
                      >
                        <p className="flex items-center justify-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
                          <SIcon className={`h-3 w-3 ${s.iconColor} transition-transform duration-200 group-hover:scale-125`} />
                          {s.label}
                        </p>
                        <p className={`text-xl font-bold tabular-nums mt-1 ${s.text}`}>
                          {s.value != null ? <AnimatedCounter value={s.value} /> : '--'}
                        </p>
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-200/70 dark:bg-gray-700/60">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: s.hex }}
                            initial={{ width: 0 }}
                            animate={{ width: `${s.value ?? 0}%` }}
                            transition={{ duration: 1, delay: 0.55 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
              <p className="mt-2.5 flex items-center justify-center sm:justify-start gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                <span className="relative flex h-2 w-2">
                  <span className="motion-reduce:hidden absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {lang === 'bn'
                  ? 'সাম্প্রতিক বিশ্লেষণ থেকে লাইভ আপডেট — বিস্তারিত দেখতে কার্ডে ট্যাপ করুন'
                  : 'Live from your recent analyses — tap a card for details'}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Feature Cards */}
      <motion.div variants={fadeUp}>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {lang === 'bn' ? 'AI এজেন্ট' : 'AI Agents'}
          </h2>
          <p className="hidden sm:block text-[11px] text-gray-400 dark:text-gray-500">
            {lang === 'bn' ? '৪টি বিশেষায়িত স্বাস্থ্য সহকারী' : '4 specialized health assistants'}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Link key={feature.href} href={feature.href}>
              <div className="h-full bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 dark:backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/60 p-5 transition-all duration-300 group cursor-pointer hover:-translate-y-1 hover:border-sky-200/70 dark:hover:border-sky-800/60 shadow-[0_10px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(14,165,233,0.06)] hover:shadow-[0_20px_60px_rgba(14,165,233,0.12),0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4),0_4px_12px_rgba(14,165,233,0.08)] dark:hover:shadow-[0_20px_60px_rgba(14,165,233,0.15),0_8px_24px_rgba(0,0,0,0.5)]">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${feature.tagClass}`}>
                    {lang === 'bn' ? feature.tagBn : feature.tagEn}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-base">
                  {lang === 'bn' ? feature.titleBn : feature.titleEn}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
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
        </div>
      </motion.div>

      {/* Why ShasthyaHub */}
      <motion.div variants={fadeUp}>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {lang === 'bn' ? 'কেন স্বাস্থ্যহাব' : 'Why ShasthyaHub'}
        </h2>
        <CapabilityStrip />
      </motion.div>

      {/* Recent activity + Daily tip */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentActivity />
        </div>
        <div className="lg:col-span-2">
          <DailyHealthTip />
        </div>
      </motion.div>

      {/* Emergency helplines */}
      <motion.div variants={fadeUp}>
        <EmergencyStrip />
      </motion.div>

      {/* Disclaimers */}
      <motion.div variants={fadeUp} className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/50 p-4">
        <p className="text-[13px] text-amber-700 dark:text-amber-300 leading-relaxed">
          {lang === 'bn'
            ? 'এই AI সরঞ্জামটি শুধুমাত্র তথ্যগত উদ্দেশ্যে। এটি পেশাদার চিকিৎসকের পরামর্শের বিকল্প নয়। জরুরি অবস্থায় নিকটস্থ হাসপাতালে যোগাযোগ করুন।'
            : 'This AI tool is for informational purposes only. Not a substitute for professional medical advice. In emergencies, contact your nearest hospital.'}
        </p>
      </motion.div>
    </div>
    </motion.div>
  )
}
