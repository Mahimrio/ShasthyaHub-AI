import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiError, ApiSuccess } from '@/types'

export const dynamic = 'force-dynamic'

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/

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
    const checkUsername = searchParams.get('check')?.toLowerCase().trim()

    if (checkUsername) {
      if (!USERNAME_REGEX.test(checkUsername)) {
        return NextResponse.json({
          success: true,
          data: { available: false, reason: 'Invalid format (3-30 lowercase letters, numbers, underscore only)' }
        })
      }

      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', checkUsername)
        .neq('id', user.id)
        .maybeSingle()

      return NextResponse.json({
        success: true,
        data: { available: !existing }
      })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, username')
      .eq('id', user.id)
      .single()

    return NextResponse.json<ApiSuccess<{ username: string | null; name: string | null }>>({
      success: true,
      data: {
        username: profile?.username ?? null,
        name: profile?.name ?? null
      }
    })
  } catch (error) {
    console.error('[profile/username] GET error:', error)
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to query username', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const username = (body.username || '').toLowerCase().trim()

    if (!username || !USERNAME_REGEX.test(username)) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: 'Username must be 3-30 characters with lowercase letters, numbers, and underscores only',
          error_bn: 'ইউজারনেম ৩-৩০ অক্ষরের হতে হবে এবং শুধুমাত্র ছোট হাতের অক্ষর, সংখ্যা ও আন্ডারস্কোর গ্রহণযোগ্য',
          code: 'INVALID_USERNAME'
        },
        { status: 400 }
      )
    }

    // Check if username is already taken by someone else
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: 'This username is already taken',
          error_bn: 'এই ইউজারনেমটি ইতিমধ্যে অন্য কেউ ব্যবহার করছে',
          code: 'USERNAME_TAKEN'
        },
        { status: 409 }
      )
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) {
      console.error('[profile/username] Update failed:', updateError)
      return NextResponse.json<ApiError>(
        { success: false, error: 'Failed to update username', code: 'UPDATE_FAILED' },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiSuccess<{ username: string }>>({
      success: true,
      data: { username }
    })
  } catch (error) {
    console.error('[profile/username] POST error:', error)
    return NextResponse.json<ApiError>(
      { success: false, error: 'Server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
