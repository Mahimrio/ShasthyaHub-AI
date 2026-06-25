'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  ChevronDown,
  Lightbulb,
  ShieldAlert,
  XCircle,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DrugInteraction, Language } from '@/types'

interface DrugInteractionAlertProps {
  interactions: DrugInteraction[]
  hasDangerous: boolean
  lang: Language
}

type InteractionSeverity = DrugInteraction['severity']

interface SeverityStyle {
  /** Left-accent border + tinted bg classes for the per-interaction card. */
  card: string
  /** Badge variant matching components/ui/badge.tsx custom variants. */
  badge: 'critical' | 'high' | 'medium' | 'low'
  /** Label text per language. */
  label: { en: string; bn: string }
}

const severityMap: Record<InteractionSeverity, SeverityStyle> = {
  Critical: {
    card: 'border-red-500 bg-red-50 dark:bg-red-900/30',
    badge: 'critical',
    label: { en: 'Critical', bn: 'সংকটজনক' },
  },
  Severe: {
    card: 'border-orange-500 bg-orange-50 dark:bg-orange-900/30',
    badge: 'high',
    label: { en: 'Severe', bn: 'গুরুতর' },
  },
  Moderate: {
    card: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30',
    badge: 'medium',
    label: { en: 'Moderate', bn: 'মাঝারি' },
  },
  Mild: {
    card: 'border-gray-400 bg-gray-50 dark:bg-gray-800/60',
    badge: 'low',
    label: { en: 'Mild', bn: 'হালকা' },
  },
}

function InteractionCard({
  interaction,
  lang,
}: {
  interaction: DrugInteraction
  lang: Language
}) {
  const [open, setOpen] = useState(false)
  const style = severityMap[interaction.severity]
  const risk = lang === 'bn' ? interaction.risk_bn : interaction.risk_en
  const recommendation =
    lang === 'bn' ? interaction.recommendation_bn : interaction.recommendation_en

  return (
    <div className={cn('rounded-r-lg border-l-4', style.card)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <Badge variant={style.badge}>
          {lang === 'bn' ? style.label.bn : style.label.en}
        </Badge>
        <span className="min-w-0 flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
          {interaction.drugs_involved.join(' + ')}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-gray-400 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t border-black/5 px-3 py-3 dark:border-white/5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {lang === 'bn' ? 'ঝুঁকি' : 'Risk'}
                </p>
                <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-200">
                  {risk}
                </p>
              </div>
              {interaction.mechanism_en && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {lang === 'bn' ? 'কারণ' : 'Mechanism'}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {interaction.mechanism_en}
                  </p>
                </div>
              )}
              <div className="flex items-start gap-2 rounded-lg bg-sky-50 p-2.5 dark:bg-sky-900/30">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                <p className="text-xs text-sky-800 dark:text-sky-200">
                  {recommendation}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function DrugInteractionAlert({
  interactions,
  hasDangerous,
  lang,
}: DrugInteractionAlertProps) {
  if (interactions.length === 0) {
    // No interactions — show a reassuring green banner.
    return (
      <Alert className="rounded-2xl border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20">
        <ShieldAlert className="h-5 w-5 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-sm font-semibold text-green-800 dark:text-green-200">
          {lang === 'bn'
            ? '✅ কোনো বিপজ্জনক মিথস্ক্রিয়া পাওয়া যায়নি'
            : '✅ No dangerous interactions found'}
        </AlertTitle>
        <AlertDescription className="text-xs text-green-700 dark:text-green-300">
          {lang === 'bn'
            ? 'আপনার ওষুধগুলোর মধ্যে কোনো পরিচিত বিপজ্জনক মিথস্ক্রিয়া শনাক্ত করা যায়নি।'
            : 'No known dangerous interactions detected between your medications.'}
        </AlertDescription>
      </Alert>
    )
  }

  // Sort: Critical/Severe first.
  const ordered = [...interactions].sort((a, b) => {
    const rank: Record<InteractionSeverity, number> = {
      Critical: 0,
      Severe: 1,
      Moderate: 2,
      Mild: 3,
    }
    return rank[a.severity] - rank[b.severity]
  })

  return (
    <div className="space-y-3">
      {/* Full-width critical banner */}
      {hasDangerous && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Alert
            variant="destructive"
            className="rounded-2xl border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/40"
          >
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <AlertTitle className="text-base font-bold text-red-800 dark:text-red-100">
              🚨{' '}
              {lang === 'bn'
                ? 'গুরুতর ওষুধ মিথস্ক্রিয়া শনাক্ত হয়েছে'
                : 'CRITICAL DRUG INTERACTION DETECTED'}
            </AlertTitle>
            <AlertDescription className="text-sm text-red-700 dark:text-red-200">
              {lang === 'bn'
                ? 'এই ওষুধগুলো একসাথে না খাওয়ার পরামর্শ দেওয়া হচ্ছে। অবশ্যই একজন চিকিৎসকের পরামর্শ নিন।'
                : 'Do NOT take these drugs together without consulting a doctor.'}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Yellow info banner for Moderate/Mild when nothing dangerous */}
      {!hasDangerous && (
        <Alert className="rounded-2xl border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/20">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
            {lang === 'bn'
              ? `⚠️ ${interactions.length}টি মাঝারি/হালকা মিথস্ক্রিয়া`
              : `⚠️ ${interactions.length} moderate/mild interaction${
                  interactions.length > 1 ? 's' : ''
                }`}
          </AlertTitle>
          <AlertDescription className="text-xs text-yellow-700 dark:text-yellow-300">
            {lang === 'bn'
              ? 'গুরুতর নয়, তবে সচেতন থাকুন। বিস্তারিত জানতে নিচের কার্ডগুলো দেখুন।'
              : 'Not dangerous, but worth knowing. Expand the cards below for details.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Per-interaction expandable cards */}
      <div className="space-y-2">
        {ordered.map((interaction, i) => (
          <InteractionCard
            key={`${interaction.drugs_involved.join('-')}-${i}`}
            interaction={interaction}
            lang={lang}
          />
        ))}
      </div>
    </div>
  )
}
