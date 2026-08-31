'use client'

import { FileText, Utensils, Eye, HelpCircle } from 'lucide-react'

const prompts = [
  {
    icon: FileText,
    en: 'Explain my last report',
    bn: 'আমার শেষ রিপোর্ট ব্যাখ্যা করো',
  },
  {
    icon: Utensils,
    en: 'What should I eat with diabetes?',
    bn: 'ডায়াবেটিসে কী খাওয়া উচিত?',
  },
  {
    icon: Eye,
    en: 'How do I take a good eye photo?',
    bn: 'চোখের ভালো ছবি কীভাবে তুলব?',
  },
  {
    icon: HelpCircle,
    en: 'How do I use this app?',
    bn: 'এই অ্যাপ কীভাবে ব্যবহার করব?',
  },
]

export function SuggestedPrompts({ lang, onPick }: { lang: 'bn' | 'en'; onPick: (text: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {prompts.map((p) => {
        const Icon = p.icon
        const text = lang === 'bn' ? p.bn : p.en
        return (
          <button
            key={p.en}
            onClick={() => onPick(text)}
            className="group flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-left text-xs font-medium text-gray-600 transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700 hover:shadow-sm dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:border-sky-800/60 dark:hover:text-sky-300"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-sky-500 transition-transform group-hover:scale-110" />
            {text}
          </button>
        )
      })}
    </div>
  )
}
