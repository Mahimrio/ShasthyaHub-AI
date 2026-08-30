'use client'

import { Lightbulb } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

/** Curated for the rural-Bangladesh health context — no API calls, rotates daily. */
const TIPS: { bn: string; en: string }[] = [
  {
    bn: 'ডায়াবেটিস থাকলে বছরে অন্তত একবার চোখ পরীক্ষা করান — রেটিনার ক্ষতি নীরবে শুরু হয়।',
    en: 'If you have diabetes, get your eyes checked at least once a year — retinal damage starts silently.',
  },
  {
    bn: 'ভাতের পরিমাণ অর্ধেক করে সবজি দ্বিগুণ করুন — রক্তে শর্করা নিয়ন্ত্রণে থাকবে।',
    en: 'Halve the rice, double the vegetables — it keeps blood sugar in check.',
  },
  {
    bn: 'ওষুধ ভালো লাগলেও অ্যান্টিবায়োটিকের পুরো কোর্স শেষ করুন।',
    en: 'Always finish the full antibiotic course, even if you feel better.',
  },
  {
    bn: 'প্রতিদিন অন্তত ৮ গ্লাস বিশুদ্ধ পানি পান করুন — টিউবওয়েল বা ফোটানো পানি নিরাপদ।',
    en: 'Drink at least 8 glasses of safe water daily — tubewell or boiled water is safest.',
  },
  {
    bn: 'তরকারিতে অতিরিক্ত লবণ উচ্চ রক্তচাপ বাড়ায় — পাতে আলগা লবণ নেওয়া বন্ধ করুন।',
    en: 'Extra salt raises blood pressure — stop adding raw salt to your plate.',
  },
  {
    bn: 'খাওয়ার আগে ও পরে সাবান দিয়ে হাত ধুলে ডায়রিয়া ৪০% পর্যন্ত কমে।',
    en: 'Washing hands with soap before and after meals cuts diarrhea risk by up to 40%.',
  },
  {
    bn: 'প্রেসক্রিপশন হারিয়ে ফেলবেন না — ছবি তুলে ফোনে সংরক্ষণ করুন।',
    en: "Don't lose prescriptions — photograph them and keep copies on your phone.",
  },
  {
    bn: 'সপ্তাহে অন্তত ৫ দিন ৩০ মিনিট হাঁটুন — ডায়াবেটিস ও হৃদরোগের ঝুঁকি কমবে।',
    en: 'Walk 30 minutes at least 5 days a week — it lowers diabetes and heart disease risk.',
  },
  {
    bn: 'জ্বর ৩ দিনের বেশি থাকলে অবহেলা করবেন না — ডেঙ্গু বা টাইফয়েড হতে পারে।',
    en: "Don't ignore a fever lasting over 3 days — it could be dengue or typhoid.",
  },
  {
    bn: 'ভাজা খাবারের বদলে সেদ্ধ বা ঝোল জাতীয় রান্না হৃদযন্ত্রের জন্য ভালো।',
    en: 'Boiled or stewed dishes are kinder to your heart than fried food.',
  },
  {
    bn: 'ঝাপসা দেখা, আলোয় চোখ ধাঁধানো — ছানির প্রাথমিক লক্ষণ হতে পারে। দেরি করবেন না।',
    en: 'Blurry vision or light glare can be early cataract signs — get screened early.',
  },
  {
    bn: 'গর্ভবতী মায়েদের মাসে অন্তত একবার স্বাস্থ্যকর্মীর কাছে চেকআপ করানো জরুরি।',
    en: 'Pregnant mothers should see a health worker at least once a month.',
  },
  {
    bn: 'রাতে ৭-৮ ঘণ্টা ঘুম রক্তচাপ ও মানসিক স্বাস্থ্য দুটোই ভালো রাখে।',
    en: '7–8 hours of sleep protects both blood pressure and mental health.',
  },
  {
    bn: 'ফার্মেসির পরামর্শে ওষুধ বদলাবেন না — আগে ডাক্তার বা স্বাস্থ্যকর্মীকে জিজ্ঞেস করুন।',
    en: "Don't switch medicines on a pharmacy's advice alone — ask a doctor or health worker first.",
  },
]

function dayOfYear(d: Date): number {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000)
}

export function DailyHealthTip() {
  const { lang } = useLanguage()
  const tip = TIPS[dayOfYear(new Date()) % TIPS.length]

  return (
    <section className="relative overflow-hidden rounded-2xl border border-teal-200/60 bg-teal-50/70 dark:border-teal-900/50 dark:bg-teal-950/30 p-5 shadow-sm">
      {/* quiet corner accent */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-teal-200/40 dark:bg-teal-500/10" />
      <header className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
          <Lightbulb className="h-4 w-4" />
        </span>
        <h2 className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">
          {lang === 'bn' ? 'আজকের টিপ' : "Today's Tip"}
        </h2>
      </header>
      <p className="mt-3 text-sm leading-relaxed text-teal-900 dark:text-teal-100">
        {lang === 'bn' ? tip.bn : tip.en}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-teal-700/70 dark:text-teal-300/60">
        {lang === 'bn' ? tip.en : tip.bn}
      </p>
    </section>
  )
}
