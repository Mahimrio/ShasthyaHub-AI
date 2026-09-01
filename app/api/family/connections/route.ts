import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getReciprocalRelation } from '@/lib/family/relations'
import type { ApiError, ApiSuccess, FamilyConnection, RelationType } from '@/types'

export const dynamic = 'force-dynamic'

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
    const statusFilter = searchParams.get('status') // 'pending' | 'accepted' | undefined

    let query = supabase
      .from('family_connections')
      .select('*')
      .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data: connections, error: fetchError } = await query

    if (fetchError) {
      console.error('[family/connections] Fetch error:', fetchError)
      return NextResponse.json<ApiError>(
        { success: false, error: 'Failed to fetch family connections', code: 'DB_ERROR' },
        { status: 500 }
      )
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json<ApiSuccess<FamilyConnection[]>>({
        success: true,
        data: []
      })
    }

    // Collect all other user IDs
    const otherUserIds = Array.from(
      new Set(
        connections.map(c => (c.requester_id === user.id ? c.target_id : c.requester_id))
      )
    )

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, username, district')
      .in('id', otherUserIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    const formatted: FamilyConnection[] = connections.map(c => {
      const isRequester = c.requester_id === user.id
      const otherId = isRequester ? c.target_id : c.requester_id
      const profile = profileMap.get(otherId)

      // The relation as viewed from the current user's perspective:
      // If current user is requester, relation_type is how they defined target (e.g. Target is my Father)
      // If current user is target, reverse_relation_type is how they view requester (e.g. Requester is my Son)
      const userPerspectiveRelation = isRequester ? c.relation_type : c.reverse_relation_type
      const otherPerspectiveRelation = isRequester ? c.reverse_relation_type : c.relation_type

      return {
        id: c.id,
        requester_id: c.requester_id,
        target_id: c.target_id,
        relation_type: userPerspectiveRelation as RelationType,
        reverse_relation_type: otherPerspectiveRelation as RelationType,
        status: c.status,
        created_at: c.created_at,
        accepted_at: c.accepted_at,
        other_user: {
          id: otherId,
          name: profile?.name ?? null,
          username: profile?.username ?? null,
          district: profile?.district ?? null,
        },
        is_requester: isRequester,
      }
    })

    return NextResponse.json<ApiSuccess<FamilyConnection[]>>({
      success: true,
      data: formatted
    })
  } catch (error) {
    console.error('[family/connections] Unhandled error:', error)
    return NextResponse.json<ApiError>(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
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
    const { target_id, relation_type, reverse_relation_type } = body

    if (!target_id || !relation_type) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: 'Target user ID and relation type are required',
          error_bn: 'ব্যবহারকারী এবং সম্পর্কের ধরণ নির্বাচন করুন',
          code: 'MISSING_FIELDS'
        },
        { status: 400 }
      )
    }

    if (target_id === user.id) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: 'You cannot connect with yourself',
          error_bn: 'আপনি নিজের সাথে সংযোগ তৈরি করতে পারবেন না',
          code: 'SELF_CONNECTION'
        },
        { status: 400 }
      )
    }

    // Verify target user exists
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('id, name, username, district')
      .eq('id', target_id)
      .single()

    if (targetError || !targetProfile) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: 'Target family member not found',
          error_bn: 'সদস্য পাওয়া যায়নি',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Check if an invitation or connection already exists
    const { data: existing } = await supabase
      .from('family_connections')
      .select('id, status')
      .or(
        `and(requester_id.eq.${user.id},target_id.eq.${target_id}),and(requester_id.eq.${target_id},target_id.eq.${user.id})`
      )
      .maybeSingle()

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json<ApiError>(
          {
            success: false,
            error: 'You are already connected with this family member',
            error_bn: 'আপনি ইতিমধ্যে এই পরিবারের সদস্যের সাথে সংযুক্ত',
            code: 'ALREADY_CONNECTED'
          },
          { status: 409 }
        )
      } else if (existing.status === 'pending') {
        return NextResponse.json<ApiError>(
          {
            success: false,
            error: 'An invitation is already pending between you two',
            error_bn: 'একটি আমন্ত্রণ ইতিমধ্যে অপেক্ষমান রয়েছে',
            code: 'INVITATION_PENDING'
          },
          { status: 409 }
        )
      }
    }

    const computedReverse = (reverse_relation_type || getReciprocalRelation(relation_type)) as RelationType

    const { data: created, error: insertError } = await supabase
      .from('family_connections')
      .insert({
        requester_id: user.id,
        target_id,
        relation_type,
        reverse_relation_type: computedReverse,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[family/connections] Insert error:', insertError)
      return NextResponse.json<ApiError>(
        { success: false, error: 'Failed to send family invitation', code: 'INSERT_FAILED' },
        { status: 500 }
      )
    }

    const result: FamilyConnection = {
      id: created.id,
      requester_id: created.requester_id,
      target_id: created.target_id,
      relation_type: created.relation_type as RelationType,
      reverse_relation_type: created.reverse_relation_type as RelationType,
      status: created.status,
      created_at: created.created_at,
      accepted_at: created.accepted_at,
      other_user: {
        id: targetProfile.id,
        name: targetProfile.name,
        username: targetProfile.username,
        district: targetProfile.district,
      },
      is_requester: true,
    }

    return NextResponse.json<ApiSuccess<FamilyConnection>>({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('[family/connections] POST error:', error)
    return NextResponse.json<ApiError>(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
