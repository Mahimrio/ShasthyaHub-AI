'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'

export interface Doctor {
  id: string
  name: string
  name_bn: string | null
  qualification: string
  specialty: string
  hospital_name: string
  hospital_bn: string | null
  area: string
  district: string
  phone: string | null
  visiting_hours: string | null
  rating: number | null
  experience_years: number | null
}

interface UseDoctorsParams {
  specialty: string | null
  enabled: boolean
}

interface UseDoctorsReturn {
  doctors: Doctor[]
  isLoading: boolean
  isError: boolean
}

export const DOCTORS_KEY = ['doctors'] as const

export function useDoctors({ specialty, enabled }: UseDoctorsParams): UseDoctorsReturn {
  const { profile } = useAuth()

  const { data, isLoading, isError } = useQuery<Doctor[]>({
    queryKey: [...DOCTORS_KEY, specialty, profile?.district ?? 'Dhaka'],
    enabled: enabled && !!specialty,
    staleTime: 120_000,
    queryFn: async () => {
      const district = profile?.district ?? 'Dhaka'
      const res = await fetch(`/api/nayan/doctors?specialty=${encodeURIComponent(specialty!)}&district=${encodeURIComponent(district)}`)
      if (!res.ok) throw new Error('Failed to fetch doctors')
      const json = await res.json()
      return (json.data ?? []) as Doctor[]
    },
  })

  return {
    doctors: data ?? [],
    isLoading,
    isError,
  }
}
