import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLocalConnections } from '@/lib/family/store'
import { getLocalSchedules, getLocalDoseLogs } from '@/lib/medications/store'
import { inferPillAvatar } from '@/lib/services/medication-reminder'
import type { DoseLog, PillShapeType } from '@/types'

const DATA_DIR = path.join(process.cwd(), '.data')
const CAREGIVER_SUBS_FILE = path.join(DATA_DIR, 'caregiver_subscriptions.json')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function getSubscriptions(userId: string): Record<string, boolean> {
  ensureDir()
  if (!fs.existsSync(CAREGIVER_SUBS_FILE)) return {}
  try {
    const raw = fs.readFileSync(CAREGIVER_SUBS_FILE, 'utf-8')
    const all: Record<string, Record<string, boolean>> = JSON.parse(raw) || {}
    return all[userId] || {}
  } catch {
    return {}
  }
}

function saveSubscription(userId: string, memberId: string, enabled: boolean) {
  ensureDir()
  let all: Record<string, Record<string, boolean>> = {}
  if (fs.existsSync(CAREGIVER_SUBS_FILE)) {
    try {
      all = JSON.parse(fs.readFileSync(CAREGIVER_SUBS_FILE, 'utf-8')) || {}
    } catch {
      all = {}
    }
  }
  if (!all[userId]) all[userId] = {}
  all[userId][memberId] = enabled
  fs.writeFileSync(CAREGIVER_SUBS_FILE, JSON.stringify(all, null, 2), 'utf-8')
}

export interface CaregiverMissedDoseItem {
  scheduleId: string
  drugNameEn: string
  drugNameBn: string
  dosage: string
  scheduledTime: string
  pillShape: PillShapeType
  pillColor: string
  pillColorSecondary?: string
  descriptorBn: string
}

export interface CaregiverMemberAlert {
  memberId: string
  memberName: string
  relation: string
  username?: string
  missedDoses: CaregiverMissedDoseItem[]
  totalActiveDrugs: number
  isSubscribed: boolean
}

export async function GET() {
  try {
    let currentUserId = 'anon'
    try {
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) currentUserId = user.id
    } catch {
      // fallback to anon/local
    }

    const rawConns = getLocalConnections().filter(
      (c) =>
        (c.requester_id === currentUserId || c.target_id === currentUserId) &&
        c.status === 'accepted'
    )
    const subscriptions = getSubscriptions(currentUserId)

    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const today = now.toISOString().split('T')[0]

    const alerts: CaregiverMemberAlert[] = []

    for (const conn of rawConns) {
      const memberId = conn.requester_id === currentUserId ? conn.target_id : conn.requester_id
      const relation = conn.requester_id === currentUserId ? conn.relation_type : conn.reverse_relation_type
      const schedules = getLocalSchedules(memberId).filter((s) => s.is_active && !s.is_archived)
      const logs = getLocalDoseLogs(memberId).filter((l: DoseLog) =>
        l.scheduled_for.startsWith(today)
      )

      const missedDoses: CaregiverMissedDoseItem[] = []

      for (const schedule of schedules) {
        const log = logs.find((l: DoseLog) => l.schedule_id === schedule.id)
        const isTaken = log?.status === 'taken'

        const [hStr, mStr] = schedule.scheduled_time.split(':')
        const targetMins = parseInt(hStr, 10) * 60 + parseInt(mStr || '0', 10)

        // Past scheduled time + 45-minute grace period
        const isMissed = targetMins + 45 < nowMinutes && !isTaken

        if (isMissed) {
          const avatar = inferPillAvatar(schedule.drug_name_en, schedule.dosage)
          missedDoses.push({
            scheduleId: schedule.id,
            drugNameEn: schedule.drug_name_en,
            drugNameBn: schedule.drug_name_bn,
            dosage: schedule.dosage,
            scheduledTime: schedule.scheduled_time,
            pillShape: avatar.shape,
            pillColor: avatar.color,
            pillColorSecondary: avatar.colorSecondary,
            descriptorBn: avatar.descriptorBn,
          })
        }
      }

      // If user hasn't explicitly set subscription, default to true for direct parents/grandparents
      const defaultSubscribed =
        ['Father', 'Mother', 'Grandfather', 'Grandmother', 'Child'].includes(relation)
      const isSubscribed =
        subscriptions[memberId] !== undefined
          ? subscriptions[memberId]
          : defaultSubscribed

      if (missedDoses.length > 0 || isSubscribed) {
        alerts.push({
          memberId,
          memberName: relation,
          relation,
          missedDoses,
          totalActiveDrugs: schedules.length,
          isSubscribed,
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        subscriptions,
      },
    })
  } catch (error) {
    console.error('[CaregiverAlerts API Error]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load caregiver alerts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { member_id, enabled } = body

    if (!member_id) {
      return NextResponse.json({ success: false, error: 'Missing member_id' }, { status: 400 })
    }

    let currentUserId = 'anon'
    try {
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) currentUserId = user.id
    } catch {
      // fallback
    }

    saveSubscription(currentUserId, member_id, Boolean(enabled))

    return NextResponse.json({
      success: true,
      data: { member_id, enabled: Boolean(enabled) },
    })
  } catch (error) {
    console.error('[CaregiverAlerts POST Error]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update alert subscription' },
      { status: 500 }
    )
  }
}
