import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLocalSettings, saveLocalSettings } from '@/lib/medications/store'
import type { UserReminderSettings } from '@/types'

export async function GET(_request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || 'demo-user-id'

    if (user?.id) {
      try {
        const { data, error } = await supabase
          .from('user_reminder_settings')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (!error && data) {
          return NextResponse.json({ success: true, data })
        }
      } catch {
        // fallback
      }
    }

    const settings = getLocalSettings(userId)
    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('[MedicationSettings API GET Error]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
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

    const userId = user?.id || 'demo-user-id'
    const body = await request.json()

    const updated: UserReminderSettings = {
      user_id: userId,
      breakfast_time: body.breakfast_time || '08:00',
      lunch_time: body.lunch_time || '13:30',
      dinner_time: body.dinner_time || '21:30',
      bedtime: body.bedtime || '22:30',
      notifications_enabled: body.notifications_enabled !== undefined ? body.notifications_enabled : true,
      sound_enabled: body.sound_enabled !== undefined ? body.sound_enabled : true,
      notify_caregivers_on_missed: body.notify_caregivers_on_missed !== undefined ? body.notify_caregivers_on_missed : true,
      grace_period_minutes: body.grace_period_minutes || 45,
    }

    if (user?.id) {
      try {
        const { error } = await supabase
          .from('user_reminder_settings')
          .upsert(updated, { onConflict: 'user_id' })

        if (!error) {
          saveLocalSettings(updated)
          return NextResponse.json({ success: true, data: updated })
        }
      } catch {
        // fallback
      }
    }

    saveLocalSettings(updated)
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[MedicationSettings API POST Error]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save reminder settings' },
      { status: 500 }
    )
  }
}
