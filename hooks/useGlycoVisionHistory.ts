'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import type { RiskLevel } from '@/types'

export interface FoodResultLight {
  id: string
  risk_level: RiskLevel | null
  risk_summary_en: string | null
  risk_summary_bn: string | null
  total_calories: number | null
  glycemic_load: number | null
  created_at: string
}

interface UseGlycoVisionHistoryReturn {
  history: FoodResultLight[]
  isLoading: boolean
  isError: boolean
}

export const GLYCOVISION_HISTORY_KEY = ['glycovision-history'] as const

export function useGlycoVisionHistory(): UseGlycoVisionHistoryReturn {
  const { user } = useAuth()

  const { data, isLoading, isError } = useQuery<FoodResultLight[]>({
    queryKey: [...GLYCOVISION_HISTORY_KEY, user?.id ?? 'anonymous'],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('food_analyses')
        .select('id, risk_level, risk_summary_en, risk_summary_bn, total_calories, glycemic_load, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error
      if (!data) return []

      return data.map((row) => ({
        id: String(row.id),
        risk_level: (row.risk_level as RiskLevel | null) ?? null,
        risk_summary_en: (row.risk_summary_en as string | null) ?? null,
        risk_summary_bn: (row.risk_summary_bn as string | null) ?? null,
        total_calories: row.total_calories !== null && row.total_calories !== undefined
          ? Number(row.total_calories) : null,
        glycemic_load: row.glycemic_load !== null && row.glycemic_load !== undefined
          ? Number(row.glycemic_load) : null,
        created_at: String(row.created_at),
      }))
    },
  })

  return {
    history: data ?? [],
    isLoading,
    isError,
  }
}
