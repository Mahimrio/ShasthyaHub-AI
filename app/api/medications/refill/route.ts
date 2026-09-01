import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLocalSchedules, saveLocalSchedule } from '@/lib/medications/store'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || 'demo-user-id'
    const body = await request.json()
    const { schedule_id, refill_amount = 10 } = body

    if (!schedule_id) {
      return NextResponse.json({ success: false, error: 'Missing schedule_id' }, { status: 400 })
    }

    const schedules = getLocalSchedules(userId)
    const target = schedules.find((s) => s.id === schedule_id)

    if (!target) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 })
    }

    // Match all doses for the same drug
    const drugKey = target.drug_name_en.toLowerCase().trim()
    const matchingSchedules = schedules.filter((s) => s.drug_name_en.toLowerCase().trim() === drugKey)

    for (const s of matchingSchedules) {
      const currentRemaining = s.remaining_quantity !== undefined ? s.remaining_quantity : 10
      s.remaining_quantity = currentRemaining + refill_amount
      saveLocalSchedule(s)
    }

    if (user?.id) {
      try {
        for (const s of matchingSchedules) {
          await supabase
            .from('medication_schedules')
            .update({ remaining_quantity: s.remaining_quantity })
            .eq('id', s.id)
            .eq('user_id', userId)
        }
      } catch {
        // fallback
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully refilled +${refill_amount} units`,
      remaining_quantity: target.remaining_quantity,
    })
  } catch (error) {
    console.error('[MedicationRefill API Error]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to refill medication' },
      { status: 500 }
    )
  }
}
