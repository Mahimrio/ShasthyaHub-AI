'use client'

import { useLanguage } from '@/contexts/LanguageContext'

type Mode = 'online' | 'offline'

interface Props {
  mode: Mode
}

const labels: Record<Mode, { en: string; bn: string }> = {
  online: { en: 'Verified · Online', bn: 'নিশ্চিত · অনলাইন' },
  offline: { en: 'Preliminary · Offline', bn: 'প্রাথমিক · অফলাইন' },
}

export function AnalysisModeBadge({ mode }: Props) {
  const { lang } = useLanguage()

  const isOnline = mode === 'online'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-wide ${
        isOnline
          ? 'bg-green-100 text-green-700'
          : 'bg-amber-100 text-amber-700'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-amber-500'
        }`}
      />
      {labels[mode][lang]}
    </span>
  )
}
