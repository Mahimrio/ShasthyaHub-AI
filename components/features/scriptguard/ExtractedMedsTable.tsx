'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, HelpCircle, Pill } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ExtractedMedication, Language, MappingConfidence } from '@/types'

interface ExtractedMedsTableProps {
  drugs: ExtractedMedication[]
  lang: Language
  mode?: 'online' | 'offline'
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

function confidenceVariant(c: MappingConfidence): 'green' | 'yellow' | 'red' {
  if (c === 'high') return 'green'
  if (c === 'medium') return 'yellow'
  return 'red'
}

function confidenceTooltip(c: MappingConfidence, lang: Language): string {
  if (lang === 'bn') {
    return c === 'high'
      ? 'উচ্চ আত্মবিশ্বাস — ডাটাবেস ম্যাচ'
      : c === 'medium'
        ? 'AI অনুমান — ফার্মাসিস্টের সাথে যাচাই করুন'
        : 'অনিশ্চিত — অবশ্যই যাচাই করুন'
  }
  return c === 'high'
    ? 'High confidence DB match'
    : c === 'medium'
      ? 'AI-inferred — verify with pharmacist'
      : 'Uncertain — please verify'
}

function confidenceLabel(c: MappingConfidence, lang: Language): string {
  if (lang === 'bn') {
    return c === 'high' ? 'নিশ্চিত' : c === 'medium' ? 'মোটামুটি' : 'অনিশ্চিত'
  }
  return c === 'high' ? 'High' : c === 'medium' ? 'Medium' : 'Low'
}

export default function ExtractedMedsTable({ drugs, lang, mode }: ExtractedMedsTableProps) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (drugs.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {lang === 'bn' ? 'কোনো ওষুধ শনাক্ত করা যায়নি।' : 'No medications detected.'}
      </p>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div variants={container} initial="hidden" animate="show">
        {/* Desktop: table */}
        <div className="hidden overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700 sm:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/80 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-3 py-2.5 font-semibold">
                  {lang === 'bn' ? 'লেখা' : 'Written'}
                </th>
                <th className="px-3 py-2.5 font-semibold">
                  {lang === 'bn' ? 'ব্র্যান্ড' : 'Brand'}
                </th>
                <th className="px-3 py-2.5 font-semibold">
                  {lang === 'bn' ? 'জেনেরিক' : 'Generic'}
                </th>
                <th className="px-3 py-2.5 font-semibold">
                  {lang === 'bn' ? 'শ্রেণী' : 'Class'}
                </th>
                <th className="px-3 py-2.5 font-semibold text-right">
                  {lang === 'bn' ? 'নিশ্চয়তা' : 'Confidence'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/60">
              {drugs.map((drug, i) => (
                <motion.tr
                  key={`${drug.written_text}-${i}`}
                  variants={item}
                  className="text-gray-700 dark:text-gray-200 hover:bg-gray-50/70 dark:hover:bg-gray-800/60"
                >
                  <td className="px-3 py-2.5 align-top">
                    <span className="text-gray-500 dark:text-gray-400 italic">
                      &ldquo;{drug.written_text}&rdquo;
                    </span>
                  </td>
                  <td className="px-3 py-2.5 align-top font-medium">{drug.brand_name}</td>
                  <td className="px-3 py-2.5 align-top text-gray-600 dark:text-gray-300">
                    {drug.generic_name}
                  </td>
                  <td className="px-3 py-2.5 align-top text-gray-500 dark:text-gray-400">
                    {drug.drug_class || '—'}
                  </td>
                  <td className="px-3 py-2.5 align-top text-right">
                    <div className="inline-flex items-center gap-1">
                      {mode === 'offline' && (
                        <span className="text-[10px] uppercase tracking-wider text-amber-500 dark:text-amber-400 font-semibold">
                          OCR
                        </span>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={confidenceTooltip(drug.mapping_confidence, lang)}
                            className="inline-flex items-center"
                          >
                            <Badge
                              variant={confidenceVariant(drug.mapping_confidence)}
                              className="cursor-help"
                            >
                              {drug.mapping_confidence === 'high' ? (
                                <Check className="mr-1 h-3 w-3" />
                              ) : (
                                <HelpCircle className="mr-1 h-3 w-3" />
                              )}
                              {confidenceLabel(drug.mapping_confidence, lang)}
                            </Badge>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {confidenceTooltip(drug.mapping_confidence, lang)}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: expandable cards */}
        <div className="space-y-2 sm:hidden">
          {drugs.map((drug, i) => {
            const isOpen = expanded === i
            return (
              <motion.div
                key={`${drug.written_text}-${i}`}
                variants={item}
                className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="flex w-full items-center gap-3 p-3 text-left"
                  aria-expanded={isOpen}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                    <Pill className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {drug.brand_name}
                    </p>
                    <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                      {drug.generic_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {mode === 'offline' && (
                      <span className="text-[10px] uppercase tracking-wider text-amber-500 dark:text-amber-400 font-semibold">
                        OCR
                      </span>
                    )}
                    <Badge variant={confidenceVariant(drug.mapping_confidence)}>
                      {drug.mapping_confidence === 'high' ? (
                        <Check className="mr-1 h-3 w-3" />
                      ) : (
                        <HelpCircle className="mr-1 h-3 w-3" />
                      )}
                      {confidenceLabel(drug.mapping_confidence, lang)}
                    </Badge>
                  </div>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'overflow-hidden border-t border-gray-50 dark:border-gray-700/60',
                    isOpen ? 'block' : 'hidden'
                  )}
                >
                  <dl className="grid grid-cols-2 gap-2 p-3 text-xs">
                    <div>
                      <dt className="text-gray-400 dark:text-gray-500">
                        {lang === 'bn' ? 'লেখা' : 'Written'}
                      </dt>
                      <dd className="mt-0.5 text-gray-600 dark:text-gray-300 italic">
                        &ldquo;{drug.written_text}&rdquo;
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-400 dark:text-gray-500">
                        {lang === 'bn' ? 'শ্রেণী' : 'Class'}
                      </dt>
                      <dd className="mt-0.5 text-gray-600 dark:text-gray-300">
                        {drug.drug_class || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-400 dark:text-gray-500">
                        {lang === 'bn' ? 'মাত্রা' : 'Dosage'}
                      </dt>
                      <dd className="mt-0.5 text-gray-600 dark:text-gray-300">
                        {drug.dosage || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-400 dark:text-gray-500">
                        {lang === 'bn' ? 'নির্দেশনা' : 'Instruction'}
                      </dt>
                      <dd className="mt-0.5 text-gray-600 dark:text-gray-300">
                        {drug.instructions || '—'}
                      </dd>
                    </div>
                  </dl>
                  <p className="border-t border-gray-50 dark:border-gray-700/60 bg-yellow-50/60 dark:bg-yellow-900/20 px-3 py-2 text-[11px] text-yellow-700 dark:text-yellow-300">
                    {confidenceTooltip(drug.mapping_confidence, lang)}
                  </p>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </TooltipProvider>
  )
}
