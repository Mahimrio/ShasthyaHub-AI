import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getLocalSchedules,
  saveLocalSchedule,
  saveLocalBatchSchedules,
  deleteLocalSchedule,
  getLocalSettings,
} from '@/lib/medications/store'
import { convertScriptGuardToScheduleItems } from '@/lib/services/medication-reminder'
import type { MedicationScheduleItem, MedicationSchedule } from '@/types'

export async function GET(_request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || 'demo-user-id'

    // Try Supabase first
    if (user?.id) {
      try {
        const { data, error } = await supabase
          .from('medication_schedules')
          .select('*')
          .eq('user_id', userId)
          .order('scheduled_time', { ascending: true })

        if (!error && data) {
          return NextResponse.json({ success: true, data })
        }
      } catch (dbErr) {
        console.warn('[MedicationSchedule API] Supabase query failed, using local store:', dbErr)
      }
    }

    // Fallback to local store
    const local = getLocalSchedules(userId)
    local.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
    return NextResponse.json({ success: true, data: local })
  } catch (error) {
    console.error('[MedicationSchedule API GET Error]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch medication schedules' },
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

    // Mode 1: Import directly from ScriptGuard analysis result
    if (body.from_scriptguard && body.digital_schedule) {
      const schedule: MedicationSchedule = body.digital_schedule
      const settings = getLocalSettings(userId)
      const items = convertScriptGuardToScheduleItems(
        schedule,
        userId,
        settings,
        body.prescription_id,
        body.quantities_map
      )

      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('medication_schedules')
            .insert(items)
            .select()
          if (!error && data) {
            saveLocalBatchSchedules(items)
            return NextResponse.json({ success: true, data: items, count: items.length })
          }
        } catch {
          // fallback to local
        }
      }

      saveLocalBatchSchedules(items)
      return NextResponse.json({ success: true, data: items, count: items.length })
    }

    // Mode 2: Single manual item creation / update
    const item: MedicationScheduleItem = {
      id: body.id || `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      user_id: userId,
      prescription_id: body.prescription_id || null,
      drug_name_en: body.drug_name_en || 'Medicine',
      drug_name_bn: body.drug_name_bn || body.drug_name_en || 'ঔষধ',
      dosage: body.dosage || '1 unit',
      meal_timing: body.meal_timing || 'after_meal',
      scheduled_time: body.scheduled_time || '08:00',
      slot_type: body.slot_type || 'morning',
      frequency_code: body.frequency_code || '1+0+1',
      interval_hours: body.interval_hours || null,
      instructions_en: body.instructions_en || '',
      instructions_bn: body.instructions_bn || '',
      start_date: body.start_date || new Date().toISOString().split('T')[0],
      duration_days: body.duration_days || 7,
      is_active: body.is_active !== undefined ? body.is_active : true,
      created_at: new Date().toISOString(),
    }

    if (user?.id) {
      try {
        const { error } = await supabase.from('medication_schedules').upsert(item)
        if (!error) {
          saveLocalSchedule(item)
          return NextResponse.json({ success: true, data: item })
        }
      } catch {
        // fallback
      }
    }

    saveLocalSchedule(item)
    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error('[MedicationSchedule API POST Error]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save medication schedule' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || 'demo-user-id'
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing schedule ID' }, { status: 400 })
    }

    if (user?.id) {
      try {
        await supabase
          .from('medication_schedules')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)
      } catch {
        // continue
      }
    }

    deleteLocalSchedule(userId, id)
    return NextResponse.json({ success: true, message: 'Schedule deleted' })
  } catch (error) {
    console.error('[MedicationSchedule API DELETE Error]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
}
