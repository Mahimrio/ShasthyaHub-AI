'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import type { NayanResultLight, Severity } from '@/types'

interface UseNayanHistoryReturn {
  history: NayanResultLight[]
  isLoading: boolean
  isError: boolean
}

export const NAYAN_HISTORY_KEY = ['nayan-history'] as const

/**
 * Fetches the user's 3 most recent Nayan AI analyses for the history list.
 *
 * Uses React Query (the provider is wired in components/providers.tsx). The
 * Supabase browser client is imported lazily INSIDE the query function so it
 * never runs during static prerendering — per the AGENTS.md SSR rule.
 */
export function useNayanHistory(): UseNayanHistoryReturn {
  const { user } = useAuth()

  const { data, isLoading, isError } = useQuery<NayanResultLight[]>({
    queryKey: [...NAYAN_HISTORY_KEY, user?.id ?? 'anonymous'],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      // Lazy import keeps this out of the SSR/prerender bundle.
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('eye_analyses')
        .select('id, diagnosis, severity, created_at, confidence_score, recommendation_en, recommendation_bn, urgency_days, specialist_needed, groq_processed_output')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error
      if (!data) return []

      // Supabase returns loosely-typed rows; narrow to the projection shape.
      return data.map((row) => {
        const groq = typeof row.groq_processed_output === 'object' && row.groq_processed_output !== null
          ? (row.groq_processed_output as Record<string, unknown>)
          : null

        return {
          id: String(row.id),
          diagnosis: (row.diagnosis as string | null) ?? null,
          severity: (row.severity as Severity | null) ?? null,
          created_at: String(row.created_at),
          confidence_score:
            row.confidence_score !== null && row.confidence_score !== undefined
              ? Number(row.confidence_score)
              : null,
          recommendation_en: (row.recommendation_en as string | null) ?? (groq?.recommendation_en as string | null) ?? null,
          recommendation_bn: (row.recommendation_bn as string | null) ?? (groq?.recommendation_bn as string | null) ?? null,
          urgency_days: typeof row.urgency_days === 'number' ? row.urgency_days : (groq?.urgency_days as number | null) ?? null,
          specialist_needed: (row.specialist_needed as string | null) ?? (groq?.specialist_needed as string | null) ?? null,
          next_steps: Array.isArray(groq?.next_steps) ? (groq.next_steps as string[]) : null,
          disease_description_en: (groq?.disease_description_en as string | null) ?? null,
          disease_description_bn: (groq?.disease_description_bn as string | null) ?? null,
          disease_stage: (groq?.disease_stage as string | null) ?? null,
        }
      })
    },
  })

  return {
    history: data ?? [],
    isLoading,
    isError,
  }
}
