import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getLocalSchedules, getLocalDoseLogs } from '@/lib/medications/store'
import {
  inferPillAvatar,
  parseTzOffset,
  clientClock,
  scheduledInstant,
} from '@/lib/services/medication-reminder'
import { getAcceptedFamilyLink } from '@/lib/family/authorize'
import { saveLocalNudge } from '@/lib/family/nudges'
import type { FamilyMemberMedicationStatus, DoseLog, MedicationScheduleItem } from '@/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('member_id')
    const tzOffset = parseTzOffset(searchParams.get('tz_offset'))

    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Missing member_id' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const isSelf = memberId === user.id
    if (!isSelf) {
      const link = await getAcceptedFamilyLink(supabase, user.id, memberId)
      if (!link) {
        return NextResponse.json(
          { success: false, error: 'You are not connected to this family member', code: 'FORBIDDEN' },
          { status: 403 }
        )
      }
    }

    const now = new Date()
    const { dateKey: today, minutes: nowMinutes } = clientClock(now, tzOffset)
    const dayStart = scheduledInstant('00:00', now, tzOffset)

    let schedules: MedicationScheduleItem[] = []
    let logs: DoseLog[] = []

    try {
      // Connection verified above; service role bypasses RLS for the member's rows.
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const client = serviceKey && supabaseUrl
        ? createSupabaseClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
        : supabase

      const [schedRes, logRes] = await Promise.all([
        client.from('medication_schedules').select('*').eq('user_id', memberId).eq('is_active', true),
        client.from('dose_logs').select('*').eq('user_id', memberId).gte('scheduled_for', dayStart.toISOString())
      ])

      if (schedRes.data && schedRes.data.length > 0) schedules = schedRes.data
      if (logRes.data && logRes.data.length > 0) logs = logRes.data
    } catch {
      // fallback to local
    }

    if (schedules.length === 0) {
      schedules = getLocalSchedules(memberId).filter((s) => s.is_active && !s.is_archived)
    }
    if (logs.length === 0) {
      logs = getLocalDoseLogs(memberId).filter((l: DoseLog) => l.scheduled_for.startsWith(today) || new Date(l.scheduled_for) >= dayStart)
    }

    const totalMeds = new Set(schedules.map((s) => s.drug_name_en.toLowerCase())).size
    const totalDosesToday = schedules.length

    let takenCount = 0
    let missedCount = 0
    let nextDoseTime: string | undefined

    const activePills = schedules.map((s) => {
      const log = logs.find((l: DoseLog) => l.schedule_id === s.id)
      const status = log ? log.status : 'pending'

      const [hStr, mStr] = s.scheduled_time.split(':')
      const targetMins = parseInt(hStr, 10) * 60 + parseInt(mStr || '0', 10)

      const isExplicitlyMissed = status === 'missed'
      const isPastGrace = targetMins + 45 <= nowMinutes && status !== 'taken' && status !== 'skipped'
      const isMissed = isExplicitlyMissed || isPastGrace

      if (status === 'taken') takenCount++
      if (isMissed) missedCount++

      const isDueNow = targetMins <= nowMinutes && status !== 'taken'

      if (targetMins > nowMinutes && !nextDoseTime) {
        nextDoseTime = s.scheduled_time
      }

      const avatar = inferPillAvatar(s.drug_name_en, s.dosage)

      return {
        drugNameEn: s.drug_name_en,
        drugNameBn: s.drug_name_bn,
        dosage: s.dosage,
        shape: s.pill_shape || avatar.shape,
        color: s.pill_color || avatar.color,
        colorSecondary: s.pill_color_secondary || avatar.colorSecondary,
        descriptorBn: avatar.descriptorBn,
        isDueNow,
      }
    })

    const complianceRate =
      totalDosesToday > 0 ? Math.round((takenCount / totalDosesToday) * 100) : 100

    let status: FamilyMemberMedicationStatus['status'] = 'none'
    if (totalDosesToday === 0) {
      status = 'none'
    } else if (missedCount > 0) {
      status = 'missed'
    } else if (takenCount === totalDosesToday) {
      status = 'all_taken'
    } else {
      status = 'upcoming'
    }

    const payload: FamilyMemberMedicationStatus = {
      memberId,
      totalMeds,
      totalDosesToday,
      takenDosesToday: takenCount,
      missedDosesToday: missedCount,
      complianceRate,
      status,
      nextDoseTime,
      activePills,
    }

    return NextResponse.json({ success: true, data: payload })
  } catch (error) {
    console.error('[Family Medications API Error]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch family member medications' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const memberId = typeof body.member_id === 'string' ? body.member_id : ''
    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Missing member_id' }, { status: 400 })
    }

    const link = await getAcceptedFamilyLink(supabase, user.id, memberId)
    if (!link) {
      return NextResponse.json(
        { success: false, error: 'You are not connected to this family member', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    const nudge = {
      id: `nudge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sender_id: user.id,
      target_id: memberId,
      sender_relation: link.relation,
      message: typeof body.message === 'string' ? body.message.slice(0, 200) : null,
      created_at: new Date().toISOString(),
      seen_at: null as string | null,
    }

    let persistedInDb = false
    try {
      const { error } = await supabase.from('caregiver_nudges').insert(nudge)
      persistedInDb = !error
      if (error) console.warn('[Family Nudge API] DB insert failed, using local store:', error.message)
    } catch {
      // table missing (migration 006 not run) — local store below
    }
    if (!persistedInDb) saveLocalNudge(nudge)

    return NextResponse.json({
      success: true,
      data: { id: nudge.id, target_id: memberId, created_at: nudge.created_at, delivery: persistedInDb ? 'db' : 'local' },
    })
  } catch (error) {
    console.error('[Family Nudge API Error]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send caregiver reminder nudge' },
      { status: 500 }
    )
  }
}
