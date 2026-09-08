import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getLocalSchedules,
  getLocalDoseLogs,
  saveLocalDoseLog,
  getLocalSettings,
} from '@/lib/medications/store'
import { formatTimeDisplay, generateMissedDoseAdvice } from '@/lib/services/medication-reminder'
import type {
  ActiveDoseWithStatus,
  DoseLog,
  DoseStatus,
  MedicationAdherenceSummary,
  MedicationScheduleItem,
  UserReminderSettings,
} from '@/types'

const VALID_STATUSES: DoseStatus[] = ['pending', 'taken', 'snoozed', 'missed', 'skipped']

// Server clocks (Vercel = UTC) differ from patients' clocks, so all "today"
// and "HH:mm" math runs in the client's offset, sent via ?tz_offset=<minutes>
// (JS getTimezoneOffset semantics, e.g. -360 for Asia/Dhaka). Default: Dhaka.
const DEFAULT_TZ_OFFSET_MINUTES = -360

function parseTzOffset(raw: string | null): number {
  const n = raw === null ? NaN : Number(raw)
  return Number.isFinite(n) && Math.abs(n) <= 14 * 60 ? n : DEFAULT_TZ_OFFSET_MINUTES
}

/** Wall-clock components of `date` in the client's timezone. */
function clientClock(date: Date, tzOffset: number) {
  const shifted = new Date(date.getTime() - tzOffset * 60_000)
  return {
    dateKey: shifted.toISOString().slice(0, 10),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  }
}

/** Absolute instant of `HH:mm` on the client's current calendar day. */
function scheduledInstant(scheduledTime: string, now: Date, tzOffset: number): Date {
  const [hStr, mStr] = scheduledTime.split(':')
  const { dateKey } = clientClock(now, tzOffset)
  const [y, mo, d] = dateKey.split('-').map(Number)
  const utcMillis = Date.UTC(y, mo - 1, d, parseInt(hStr, 10) || 0, parseInt(mStr || '0', 10) || 0)
  return new Date(utcMillis + tzOffset * 60_000)
}

function isActiveToday(schedule: MedicationScheduleItem, today: string): boolean {
  if (!schedule.is_active || schedule.is_archived) return false
  if (schedule.start_date && schedule.start_date > today) return false
  if (schedule.end_date && schedule.end_date < today) return false
  return true
}

async function loadUserData(userId: string, isAuthed: boolean, now: Date, tzOffset: number) {
  const supabase = await createServerSupabaseClient()
  const { dateKey: today } = clientClock(now, tzOffset)
  const dayStart = scheduledInstant('00:00', now, tzOffset)
  let schedules: MedicationScheduleItem[] = []
  let logs: DoseLog[] = []
  let settings: UserReminderSettings | null = null

  if (isAuthed) {
    try {
      const [schedRes, logRes, settingsRes] = await Promise.all([
        supabase.from('medication_schedules').select('*').eq('user_id', userId).eq('is_active', true),
        supabase.from('dose_logs').select('*').eq('user_id', userId).gte('scheduled_for', dayStart.toISOString()),
        supabase.from('user_reminder_settings').select('*').eq('user_id', userId).maybeSingle(),
      ])
      if (!schedRes.error && schedRes.data) schedules = schedRes.data
      if (!logRes.error && logRes.data) logs = logRes.data
      if (!settingsRes.error && settingsRes.data) settings = settingsRes.data
    } catch (dbErr) {
      console.warn('[MedicationLogs API] Supabase query failed, using local store:', dbErr)
    }
  }

  if (schedules.length === 0) schedules = getLocalSchedules(userId)
  if (logs.length === 0) logs = getLocalDoseLogs(userId).filter((l) => new Date(l.scheduled_for) >= dayStart)
  if (!settings) settings = getLocalSettings(userId)

  return { supabase, today, dayStart, schedules: schedules.filter((s) => isActiveToday(s, today)), logs, settings }
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id || 'demo-user-id'
    const tzOffset = parseTzOffset(new URL(request.url).searchParams.get('tz_offset'))
    const now = new Date()

    const { dayStart, schedules, logs, settings } = await loadUserData(userId, Boolean(user?.id), now, tzOffset)

    const graceMinutes = settings.grace_period_minutes ?? 45

    const doses: ActiveDoseWithStatus[] = schedules
      .map((schedule) => {
        const target = scheduledInstant(schedule.scheduled_time, now, tzOffset)
        const todayLog =
          logs.find((l) => l.schedule_id === schedule.id && new Date(l.scheduled_for) >= dayStart) ?? null
        const timeDiffMinutes = Math.round((target.getTime() - now.getTime()) / 60_000)

        let status: DoseStatus = todayLog?.status ?? 'pending'
        const snoozeActive =
          status === 'snoozed' && !!todayLog?.snoozed_until && new Date(todayLog.snoozed_until) > now
        if (status === 'snoozed' && !snoozeActive) status = 'pending'
        // An active snooze is a deliberate deferral — never escalate it to missed.
        const isMissed = status === 'pending' && -timeDiffMinutes > graceMinutes
        if (isMissed) status = 'missed'
        const isDueNow = status === 'pending' && timeDiffMinutes <= 0

        const dose: ActiveDoseWithStatus = {
          schedule,
          todayLog,
          status,
          dueTime: formatTimeDisplay(schedule.scheduled_time),
          isDueNow,
          isMissed,
          timeDiffMinutes,
        }
        if (isMissed) {
          dose.clinicalMissedAdvice = generateMissedDoseAdvice(
            schedule.drug_name_en,
            schedule.scheduled_time,
            schedule.interval_hours ?? 8,
            -timeDiffMinutes
          )
        }
        return dose
      })
      .sort((a, b) => a.schedule.scheduled_time.localeCompare(b.schedule.scheduled_time))

    const takenToday = doses.filter((d) => d.status === 'taken').length
    const missedToday = doses.filter((d) => d.status === 'missed').length
    const pendingToday = doses.filter((d) => d.status === 'pending' || d.status === 'snoozed').length
    const nextDose = doses.find((d) => d.timeDiffMinutes > 0 && d.status !== 'taken') ?? null

    const summary: MedicationAdherenceSummary = {
      totalDosesToday: doses.length,
      takenToday,
      missedToday,
      pendingToday,
      adherencePercentage: doses.length > 0 ? Math.round((takenToday / doses.length) * 100) : 100,
      weeklyStreakDays: 0,
      nextDose,
    }

    return NextResponse.json({ success: true, data: { doses, summary, settings } })
  } catch (error) {
    console.error('[MedicationLogs API GET Error]:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch medication doses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id || 'demo-user-id'

    const body = await request.json()
    const scheduleId = typeof body.schedule_id === 'string' ? body.schedule_id : ''
    const status = body.status as DoseStatus
    if (!scheduleId || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: 'schedule_id and a valid status are required' }, { status: 400 })
    }

    const tzOffset = parseTzOffset(typeof body.tz_offset === 'number' ? String(body.tz_offset) : null)
    const now = new Date()
    const { schedules, today } = await loadUserData(userId, Boolean(user?.id), now, tzOffset)
    const schedule =
      schedules.find((s) => s.id === scheduleId) ?? getLocalSchedules(userId).find((s) => s.id === scheduleId)
    if (!schedule) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 })
    }

    const scheduledTime =
      typeof body.scheduled_time === 'string' && /^\d{1,2}:\d{2}$/.test(body.scheduled_time)
        ? body.scheduled_time
        : schedule.scheduled_time
    const snoozeMinutes = Number.isFinite(body.snooze_minutes) ? Math.max(1, Math.min(180, body.snooze_minutes)) : 15

    const log: DoseLog = {
      id: `${scheduleId}-${today}-${scheduledTime.replace(':', '')}`,
      schedule_id: scheduleId,
      user_id: userId,
      scheduled_for: scheduledInstant(scheduledTime, now, tzOffset).toISOString(),
      scheduled_time: scheduledTime,
      status,
      logged_at: now.toISOString(),
      snoozed_until: status === 'snoozed' ? new Date(now.getTime() + snoozeMinutes * 60_000).toISOString() : null,
      notes: typeof body.notes === 'string' ? body.notes.slice(0, 500) : null,
      created_at: now.toISOString(),
    }

    if (user?.id) {
      try {
        const { error } = await supabase.from('dose_logs').upsert(log, { onConflict: 'id' })
        if (!error) {
          saveLocalDoseLog(log)
          return NextResponse.json({ success: true, data: log })
        }
        console.warn('[MedicationLogs API] Supabase upsert failed, using local store:', error.message)
      } catch (dbErr) {
        console.warn('[MedicationLogs API] Supabase upsert threw, using local store:', dbErr)
      }
    }

    saveLocalDoseLog(log)
    return NextResponse.json({ success: true, data: log })
  } catch (error) {
    console.error('[MedicationLogs API POST Error]:', error)
    return NextResponse.json({ success: false, error: 'Failed to record dose action' }, { status: 500 })
  }
}
