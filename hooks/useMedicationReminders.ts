'use client'

import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { audioChime } from '@/lib/services/audio-chime'
import type {
  ActiveDoseWithStatus,
  MedicationAdherenceSummary,
  UserReminderSettings,
  MedicationScheduleItem,
  MedicationSchedule,
  DoseStatus,
} from '@/types'

export const MEDICATION_DOSES_KEY = ['medication-doses'] as const
export const MEDICATION_SETTINGS_KEY = ['medication-settings'] as const

interface DosesResponse {
  doses: ActiveDoseWithStatus[]
  summary: MedicationAdherenceSummary
  settings: UserReminderSettings
}

// ── 1. Query: Fetch Today's Doses & Adherence Summary ─────────

export function useMedicationDoses() {
  const { user } = useAuth()
  const notifiedDosesRef = useRef<Set<string>>(new Set())

  const query = useQuery<DosesResponse>({
    queryKey: [...MEDICATION_DOSES_KEY, user?.id ?? 'anon'],
    queryFn: async () => {
      const res = await fetch('/api/medications/logs')
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch medication doses')
      }
      return json.data
    },
    refetchInterval: 30_000, // Refresh every 30 seconds for live clock updates
    staleTime: 10_000,
  })

  // Check for due or missed doses and play audio chime / browser notifications
  useEffect(() => {
    if (!query.data) return
    const { doses, settings } = query.data
    if (!settings.notifications_enabled) return

    for (const dose of doses) {
      const doseKey = `${dose.schedule.id}-${dose.schedule.scheduled_time}`
      if (notifiedDosesRef.current.has(doseKey)) continue

      if (dose.isDueNow && dose.status === 'pending') {
        notifiedDosesRef.current.add(doseKey)
        if (settings.sound_enabled) {
          audioChime.playReminderChime()
        }
        // Native browser notification
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification(`⏰ ঔষধের সময় হয়েছে: ${dose.schedule.drug_name_bn}`, {
              body: `${dose.schedule.drug_name_en} (${dose.schedule.dosage}) গ্রহণের সময় এখন (${dose.dueTime})।`,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-192x192.png',
            })
          }
        }
      } else if (dose.isMissed && dose.status === 'missed') {
        notifiedDosesRef.current.add(doseKey)
        if (settings.sound_enabled) {
          audioChime.playMissedDoseChime()
        }
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification(`⚠️ ঔষধ মিস হয়েছে: ${dose.schedule.drug_name_bn}`, {
              body: `${dose.schedule.drug_name_en} এর নির্ধারিত সময় (${dose.dueTime}) পার হয়ে গেছে। সতর্কবার্তা দেখুন।`,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-192x192.png',
            })
          }
        }
      }
    }
  }, [query.data])

  return query
}

// ── 2. Mutation: Record Dose Action (Taken, Snooze, Skip, Missed) ─

export function useRecordDoseAction() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      schedule_id,
      status,
      scheduled_time,
      notes,
      snooze_minutes,
    }: {
      schedule_id: string
      status: DoseStatus
      scheduled_time?: string
      notes?: string
      snooze_minutes?: number
    }) => {
      const res = await fetch('/api/medications/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id,
          status,
          scheduled_time,
          notes,
          snooze_minutes,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to record dose action')
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...MEDICATION_DOSES_KEY, user?.id ?? 'anon'],
      })
    },
  })
}

// ── 3. Mutation: Save ScriptGuard Prescription into Reminders ────

export function useSavePrescriptionToReminders() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      digital_schedule,
      prescription_id,
      quantities_map,
    }: {
      digital_schedule: MedicationSchedule
      prescription_id?: string
      quantities_map?: Record<string, number>
    }) => {
      const res = await fetch('/api/medications/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_scriptguard: true,
          digital_schedule,
          prescription_id,
          quantities_map,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save prescription reminders')
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...MEDICATION_DOSES_KEY, user?.id ?? 'anon'],
      })
    },
  })
}

// ── 4. Mutation: Add / Edit Single Medication Schedule ──────────

export function useSaveMedicationSchedule() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (scheduleItem: Partial<MedicationScheduleItem>) => {
      const res = await fetch('/api/medications/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleItem),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save medication')
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...MEDICATION_DOSES_KEY, user?.id ?? 'anon'],
      })
    },
  })
}

// ── 5. Mutation: Delete Medication Schedule ────────────────────

export function useDeleteMedicationSchedule() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const res = await fetch(`/api/medications/schedule?id=${scheduleId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete medication')
      }
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...MEDICATION_DOSES_KEY, user?.id ?? 'anon'],
      })
    },
  })
}

// ── 6. Query & Mutation: User Reminder Settings ────────────────

export function useReminderSettings() {
  const { user } = useAuth()

  return useQuery<UserReminderSettings>({
    queryKey: [...MEDICATION_SETTINGS_KEY, user?.id ?? 'anon'],
    queryFn: async () => {
      const res = await fetch('/api/medications/settings')
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch settings')
      }
      return json.data
    },
    staleTime: 60_000,
  })
}

export function useUpdateReminderSettings() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (settings: Partial<UserReminderSettings>) => {
      const res = await fetch('/api/medications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update settings')
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...MEDICATION_SETTINGS_KEY, user?.id ?? 'anon'],
      })
      queryClient.invalidateQueries({
        queryKey: [...MEDICATION_DOSES_KEY, user?.id ?? 'anon'],
      })
    },
  })
}

// ── 7. Mutation: Refill Medication Supply ─────────────────────

export function useRefillMedication() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      schedule_id,
      refill_amount = 10,
    }: {
      schedule_id: string
      refill_amount?: number
    }) => {
      const res = await fetch('/api/medications/refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_id, refill_amount }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to refill medication')
      }
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...MEDICATION_DOSES_KEY, user?.id ?? 'anon'],
      })
    },
  })
}

