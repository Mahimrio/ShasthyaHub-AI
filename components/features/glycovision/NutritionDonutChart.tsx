'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import { useLanguage } from '@/contexts/LanguageContext'

interface NutritionDonutChartProps {
  carbsG: number
  proteinG: number
  fatG: number
}

const DONUT_COLORS = {
  carbs: '#f97316',
  protein: '#ef4444',
  fat: '#3b82f6',
} as const

const RADIAN = Math.PI / 180

function renderCustomLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
  if (!percent || percent < 0.05 || !midAngle) return null
  const radius = (innerRadius as number) + ((outerRadius as number) - (innerRadius as number)) * 0.6
  const x = (cx as number) + radius * Math.cos(-(midAngle as number) * RADIAN)
  const y = (cy as number) + radius * Math.sin(-(midAngle as number) * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[11px] font-semibold"
    >
      {(percent * 100).toFixed(0)}%
    </text>
  )
}

export default function NutritionDonutChart({
  carbsG,
  proteinG,
  fatG,
}: NutritionDonutChartProps) {
  const { lang } = useLanguage()
  const total = carbsG + proteinG + fatG
  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        {lang === 'bn' ? 'কোনো পুষ্টি তথ্য নেই' : 'No nutrition data'}
      </div>
    )
  }

  const pieData = [
    { name: lang === 'bn' ? 'কার্বোহাইড্রেট' : 'Carbs', value: carbsG, color: DONUT_COLORS.carbs },
    { name: lang === 'bn' ? 'প্রোটিন' : 'Protein', value: proteinG, color: DONUT_COLORS.protein },
    { name: lang === 'bn' ? 'ফ্যাট' : 'Fat', value: fatG, color: DONUT_COLORS.fat },
  ].filter((d) => d.value > 0)

  const barData = [
    { name: lang === 'bn' ? 'কার্বস' : 'Carbs', grams: carbsG, fill: DONUT_COLORS.carbs },
    { name: lang === 'bn' ? 'প্রোটিন' : 'Protein', grams: proteinG, fill: DONUT_COLORS.protein },
    { name: lang === 'bn' ? 'ফ্যাট' : 'Fat', grams: fatG, fill: DONUT_COLORS.fat },
  ]

  return (
    <div className="space-y-6">
      {/* Donut chart */}
      <div className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
              strokeWidth={0}
              label={renderCustomLabel}
              labelLine={false}
            >
              {pieData.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                fontSize: 13,
              }}
              formatter={(value) => [`${Number(value).toFixed(1)}g`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs">
        {pieData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">{entry.name}</span>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis unit="g" tick={{ fontSize: 11 }} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              fontSize: 13,
            }}
            formatter={(value) => [`${Number(value).toFixed(1)}g`, '']}
          />
          <Bar dataKey="grams" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {barData.map((entry, i) => (
              <Cell key={`bar-${i}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
