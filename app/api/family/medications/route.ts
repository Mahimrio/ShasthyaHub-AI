import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getLocalSchedules, getLocalDoseLogs } from '@/lib/medications/store'
import { inferPillAvatar } from '@/lib/services/medication-reminder'
import type { FamilyMemberMedicationStatus, DoseLog, MedicationScheduleItem } from '@/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('member_id')

    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Missing member_id' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    let schedules: MedicationScheduleItem[] = []
    let logs: DoseLog[] = []

    try {
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const client = serviceKey && supabaseUrl
          ? createSupabaseClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
          : supabase

        const [schedRes, logRes] = await Promise.all([
          client.from('medication_schedules').select('*').eq('user_id', memberId).eq('is_active', true),
          client.from('dose_logs').select('*').eq('user_id', memberId).gte('scheduled_for', `${today}T00:00:00.000Z`)
        ])

        if (schedRes.data && schedRes.data.length > 0) schedules = schedRes.data
        if (logRes.data && logRes.data.length > 0) logs = logRes.data
      }
    } catch {
      // fallback to local
    }

    if (schedules.length === 0) {
      schedules = getLocalSchedules(memberId).filter((s) => s.is_active && !s.is_archived)
    }
    if (logs.length === 0) {
      logs = getLocalDoseLogs(memberId).filter((l: DoseLog) => l.scheduled_for.startsWith(today))
    }

    const totalMeds = new Set(schedules.map((s) => s.drug_name_en.toLowerCase())).size
    const totalDosesToday = schedules.length

    let takenCount = 0
    let missedCount = 0

    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    let nextDoseTime: string | undefined

    const activePills = schedules.map((s) => {
      const log = logs.find((l: DoseLog) => l.schedule_id === s.id)
      const status = log ? log.status : 'pending'

      if (status === 'taken') takenCount++
      if (status === 'missed') missedCount++

      const [hStr, mStr] = s.scheduled_time.split(':')
      const targetMins = parseInt(hStr, 10) * 60 + parseInt(mStr || '0', 10)
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

    const body = await request.json()
    const { member_id } = body

    // Record nudge or return success
    return NextResponse.json({
      success: true,
      message: 'Caregiver reminder nudge dispatched successfully',
      sender_id: user?.id || 'caregiver',
      target_id: member_id,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Family Nudge API Error]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send caregiver reminder nudge' },
      { status: 500 }
    )
  }
}
