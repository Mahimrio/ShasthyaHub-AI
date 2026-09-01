'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Edit3, HelpCircle, Plus, Trash2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PillAvatar } from '@/components/shared/PillAvatar'
import { inferPillAvatar } from '@/lib/services/medication-reminder'
import { cn } from '@/lib/utils'
import type { ExtractedMedication, Language, MappingConfidence } from '@/types'

interface ExtractedMedsTableProps {
  drugs: ExtractedMedication[]
  lang: Language
  mode?: 'online' | 'offline'
  onEditDrug?: (index: number) => void
  onAddDrug?: () => void
  onDeleteDrug?: (index: number) => void
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
      ? 'উচ্চ আত্মবিশ্বাস — ডাটাবেস ও ফার্মাসিউটিক্যাল ম্যাচ'
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

export default function ExtractedMedsTable({
  drugs,
  lang,
  mode,
  onEditDrug,
  onAddDrug,
  onDeleteDrug,
}: ExtractedMedsTableProps) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const isBn = lang === 'bn'

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        {/* HITL Header Controls */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {isBn ? 'শনাক্তকৃত ওষুধের তালিকা' : 'Identified Medications'} ({drugs.length})
            </span>
            <span className="text-[10px] text-gray-400">
              {isBn ? '• প্রয়োজনে সংশোধন করুন' : '• review or edit if needed'}
            </span>
          </div>

          {onAddDrug && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onAddDrug}
              className="h-8 text-xs font-bold rounded-xl border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 px-3 shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>{isBn ? 'অনুপস্থিত ওষুধ যোগ করুন' : 'Add Missing Drug'}</span>
            </Button>
          )}
        </div>

        {drugs.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
              {isBn ? 'কোনো ওষুধ শনাক্ত করা যায়নি।' : 'No medications detected.'}
            </p>
            {onAddDrug && (
              <Button
                size="sm"
                onClick={onAddDrug}
                className="h-8 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>{isBn ? 'ম্যানুয়ালি যোগ করুন' : 'Add Manually'}</span>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop: table */}
            <div className="hidden overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 sm:block bg-white dark:bg-gray-900 shadow-2xs">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/80 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-3.5 py-2.5 font-semibold">
                      {lang === 'bn' ? 'লেখা' : 'Written'}
                    </th>
                    <th className="px-3.5 py-2.5 font-semibold">
                      {lang === 'bn' ? 'ব্র্যান্ড ও রূপ' : 'Brand & Form'}
                    </th>
                    <th className="px-3.5 py-2.5 font-semibold">
                      {lang === 'bn' ? 'জেনেরিক' : 'Generic'}
                    </th>
                    <th className="px-3.5 py-2.5 font-semibold">
                      {lang === 'bn' ? 'শ্রেণী' : 'Class'}
                    </th>
                    <th className="px-3.5 py-2.5 font-semibold text-center">
                      {lang === 'bn' ? 'নিশ্চয়তা' : 'Confidence'}
                    </th>
                    <th className="px-3.5 py-2.5 font-semibold text-right">
                      {lang === 'bn' ? 'অ্যাকশন' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {drugs.map((drug, i) => {
                    const avatar = inferPillAvatar(drug.brand_name || drug.written_text, drug.dosage)

                    return (
                      <motion.tr
                        key={`${drug.written_text}-${i}`}
                        variants={item}
                        className="text-gray-700 dark:text-gray-200 hover:bg-gray-50/70 dark:hover:bg-gray-800/60 transition-colors"
                      >
                        <td className="px-3.5 py-2.5 align-middle">
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                            &ldquo;{drug.written_text}&rdquo;
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 align-middle font-medium">
                          <div className="flex items-center gap-2.5">
                            <div className="p-0.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0">
                              <PillAvatar
                                shape={avatar.shape}
                                color={avatar.color}
                                colorSecondary={avatar.colorSecondary}
                                size="xs"
                              />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                {drug.brand_name}
                              </p>
                              <span className="text-[10px] text-gray-400">
                                {drug.dosage}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 align-middle text-xs text-gray-600 dark:text-gray-300 font-medium">
                          {drug.generic_name}
                        </td>
                        <td className="px-3.5 py-2.5 align-middle text-xs text-gray-500 dark:text-gray-400">
                          {drug.drug_class || '—'}
                        </td>
                        <td className="px-3.5 py-2.5 align-middle text-center">
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
                                    className="cursor-help text-[10px] px-2 py-0.5"
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
                        <td className="px-3.5 py-2.5 align-middle text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onEditDrug && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onEditDrug(i)}
                                className="h-7 px-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg"
                                title={isBn ? 'সংশোধন করুন' : 'Edit medicine'}
                              >
                                <Edit3 className="h-3.5 w-3.5 mr-1" />
                                <span>{isBn ? 'সংশোধন' : 'Edit'}</span>
                              </Button>
                            )}

                            {onDeleteDrug && (
                              <button
                                type="button"
                                onClick={() => onDeleteDrug(i)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                title={isBn ? 'মুছে ফেলুন' : 'Delete'}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: expandable cards */}
            <div className="space-y-2 sm:hidden">
              {drugs.map((drug, i) => {
                const isOpen = expanded === i
                const avatar = inferPillAvatar(drug.brand_name || drug.written_text, drug.dosage)

                return (
                  <motion.div
                    key={`${drug.written_text}-${i}`}
                    variants={item}
                    className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-2xs"
                  >
                    <div className="flex items-center justify-between p-3">
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : i)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                        aria-expanded={isOpen}
                      >
                        <div className="p-1 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0">
                          <PillAvatar
                            shape={avatar.shape}
                            color={avatar.color}
                            colorSecondary={avatar.colorSecondary}
                            size="xs"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-gray-900 dark:text-gray-100">
                            {drug.brand_name}
                          </p>
                          <p className="truncate text-[10px] text-gray-400">
                            {drug.generic_name}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant={confidenceVariant(drug.mapping_confidence)}
                          className="text-[10px] px-1.5 py-0.5"
                        >
                          {confidenceLabel(drug.mapping_confidence, lang)}
                        </Badge>

                        {onEditDrug && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditDrug(i)}
                            className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <motion.div
                      initial={false}
                      animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'overflow-hidden border-t border-gray-100 dark:border-gray-800',
                        isOpen ? 'block' : 'hidden'
                      )}
                    >
                      <dl className="grid grid-cols-2 gap-2 p-3 text-xs">
                        <div>
                          <dt className="text-gray-400 dark:text-gray-500 text-[10px]">
                            {lang === 'bn' ? 'লেখা' : 'Written'}
                          </dt>
                          <dd className="mt-0.5 text-gray-600 dark:text-gray-300 italic text-[11px]">
                            &ldquo;{drug.written_text}&rdquo;
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 dark:text-gray-500 text-[10px]">
                            {lang === 'bn' ? 'শ্রেণী' : 'Class'}
                          </dt>
                          <dd className="mt-0.5 text-gray-600 dark:text-gray-300 text-[11px]">
                            {drug.drug_class || '—'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 dark:text-gray-500 text-[10px]">
                            {lang === 'bn' ? 'মাত্রা' : 'Dosage'}
                          </dt>
                          <dd className="mt-0.5 text-gray-600 dark:text-gray-300 text-[11px]">
                            {drug.dosage || '—'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 dark:text-gray-500 text-[10px]">
                            {lang === 'bn' ? 'নির্দেশনা' : 'Instruction'}
                          </dt>
                          <dd className="mt-0.5 text-gray-600 dark:text-gray-300 text-[11px]">
                            {drug.instructions || '—'}
                          </dd>
                        </div>
                      </dl>

                      <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 text-xs">
                        <span className="text-[10px] text-gray-400">
                          {confidenceTooltip(drug.mapping_confidence, lang)}
                        </span>
                        {onDeleteDrug && (
                          <button
                            type="button"
                            onClick={() => onDeleteDrug(i)}
                            className="text-xs text-red-500 font-semibold hover:underline"
                          >
                            {isBn ? 'মুছে ফেলুন' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </motion.div>
    </TooltipProvider>
  )
}
