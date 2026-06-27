import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiError } from '@/types'

export const dynamic = 'force-dynamic'

const TABLE_MAP = {
  eye: 'eye_analyses',
  prescription: 'prescription_analyses',
  food: 'food_analyses',
} as const

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type') as keyof typeof TABLE_MAP | null

    if (!id || !type || !TABLE_MAP[type]) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Missing or invalid id/type parameters', code: 'INVALID_PARAMS' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from(TABLE_MAP[type])
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Report not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[reports/detail] failed:', error)
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to fetch report detail', code: 'FETCH_ERROR' },
      { status: 500 }
    )
  }
}
