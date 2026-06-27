'use client'

import { motion } from 'framer-motion'
import { Activity, Beef, Droplet, Flame, Wheat } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EnrichedFoodItem, Language } from '@/types'

interface FoodItemsListProps {
  items: EnrichedFoodItem[]
  lang: Language
}

const macroIcons = {
  calories: Flame,
  carbs_g: Wheat,
  protein_g: Beef,
  fat_g: Droplet,
} as const

const macroColors = {
  calories: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50',
  carbs_g: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50',
  protein_g: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50',
  fat_g: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50',
} as const

export default function FoodItemsList({ items, lang }: FoodItemsListProps) {
  const totals = {
    calories: items.reduce((s, i) => s + i.calories, 0),
    carbs_g: items.reduce((s, i) => s + i.carbs_g, 0),
    protein_g: items.reduce((s, i) => s + i.protein_g, 0),
    fat_g: items.reduce((s, i) => s + i.fat_g, 0),
  }

  return (
    <div className="space-y-4">
      {/* Animated macro counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(macroIcons) as Array<keyof typeof macroIcons>).map((key) => {
          const Icon = macroIcons[key]
          const labelEn = key === 'calories' ? 'Calories' : `${key.replace('_g', '').charAt(0).toUpperCase() + key.replace('_g', '').slice(1)}`
          const labelBn = key === 'calories' ? 'ক্যালোরি' : key === 'carbs_g' ? 'কার্বস' : key === 'protein_g' ? 'প্রোটিন' : 'ফ্যাট'
          const unit = key === 'calories' ? 'kcal' : 'g'
          return (
            <div
              key={key}
              className="rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-700/50"
            >
              <div className={cn('mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg', macroColors[key])}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100 tabular-nums">
                {totals[key]}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">{unit}</p>
              <p className="mt-0.5 text-[10px] text-gray-300 dark:text-gray-600">
                {lang === 'bn' ? labelBn : labelEn}
              </p>
            </div>
          )
        })}
      </div>

      {/* Individual food item cards */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, i) => (
            <motion.div
              key={`${item.name_en}-${i}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {lang === 'bn' ? item.name_bn : item.name_en}
                </p>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                  <span>{item.estimated_grams}g</span>
                  <span>{item.calories} kcal</span>
                  <span>C:{item.carbs_g}g</span>
                  <span>P:{item.protein_g}g</span>
                  <span>F:{item.fat_g}g</span>
                </div>
              </div>
              <div className="ml-2 flex shrink-0 items-center gap-1">
                <Activity className="h-3 w-3 text-green-500" />
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  {Math.round(item.confidence * 100)}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
