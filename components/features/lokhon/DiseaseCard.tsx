'use client'

import Link from 'next/link'
import { Heart, Activity, Thermometer, Brain, ChevronRight, Wind, Droplets } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LokhonDisease } from '@/types'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  activity: Activity,
  kidney: Droplets,
  lungs: Wind,
  thermometer: Thermometer,
  brain: Brain,
}

interface DiseaseCardProps {
  disease: LokhonDisease
  lang: 'en' | 'bn'
}

export function DiseaseCard({ disease, lang }: DiseaseCardProps) {
  const Icon = ICON_MAP[disease.icon ?? ''] || Heart

  return (
    <Link
      href={`/lokhon/${disease.slug}`}
      className={cn(
        'group relative flex items-start gap-4 p-5 rounded-2xl border border-gray-100 dark:border-gray-700',
        'bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm',
        'shadow-[0_10px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(14,165,233,0.06)]',
        'hover:shadow-[0_20px_60px_rgba(14,165,233,0.12),0_8px_24px_rgba(0,0,0,0.08)]',
        'dark:shadow-[0_10px_40px_rgba(0,0,0,0.4),0_4px_12px_rgba(14,165,233,0.08)]',
        'dark:hover:shadow-[0_20px_60px_rgba(14,165,233,0.15),0_8px_24px_rgba(0,0,0,0.5)]',
        'hover:border-sky-200 dark:hover:border-sky-800/60',
        'transition-all duration-300'
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-md">
        {Icon && <Icon className="h-6 w-6 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
          {lang === 'bn' ? disease.name_bn : disease.name_en}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">
          {lang === 'bn' ? disease.description_bn : disease.description_en}
        </p>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
          <span>{lang === 'bn' ? disease.estimated_time_bn : disease.estimated_time_en}</span>
          <span>·</span>
          <span>
            {disease.question_count ?? 0} {lang === 'bn' ? 'টি প্রশ্ন' : 'questions'}
          </span>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-sky-500 group-hover:translate-x-1 transition-all duration-200 self-center" />
    </Link>
  )
}
