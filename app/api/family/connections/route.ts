import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getReciprocalRelation } from '@/lib/family/relations'
import {
  getLocalConnections,
  saveLocalConnections,
  getLocalUsername,
  type StoredFamilyConnection
} from '@/lib/family/store'
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

    let rawConnections: StoredFamilyConnection[] = []
    let usedDb = false

    try {
      let query = supabase
        .from('family_connections')
        .select('*')
        .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data: connections, error: fetchError } = await query

      if (!fetchError && connections) {
        rawConnections = connections as StoredFamilyConnection[]
        usedDb = true
      }
    } catch {
      // Table doesn't exist in Supabase DB yet
    }

    if (!usedDb) {
      const allLocal = getLocalConnections()
      rawConnections = allLocal.filter(c => {
        const involvesUser = c.requester_id === user.id || c.target_id === user.id
        if (!involvesUser) return false
        if (statusFilter) return c.status === statusFilter
        return true
      })
    }

    if (rawConnections.length === 0) {
      return NextResponse.json<ApiSuccess<FamilyConnection[]>>({
        success: true,
        data: []
      })
    }

    // Collect all other user IDs
    const otherUserIds = Array.from(
      new Set(
        rawConnections.map(c => (c.requester_id === user.id ? c.target_id : c.requester_id))
      )
    )

    // Fetch profiles from profiles table using select('*')
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', otherUserIds)

    const profileMap = new Map((profiles || []).map(p => [p.id, p]))

    // Also fetch auth users for emails/names if service key is present
    const authMap = new Map<string, { email: string | null; name: string | null }>()
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (serviceKey && supabaseUrl) {
      try {
        const adminSupabase = createSupabaseClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
        const { data: adminUsersRes } = await adminSupabase.auth.admin.listUsers({ perPage: 100 })
        if (adminUsersRes?.users) {
          for (const u of adminUsersRes.users) {
            authMap.set(u.id, {
              email: u.email || null,
              name: u.user_metadata?.name || null,
            })
          }
        }
      } catch {
        // Fallback
      }
    }

    const formatted: FamilyConnection[] = rawConnections.map(c => {
      const isRequester = c.requester_id === user.id
      const otherId = isRequester ? c.target_id : c.requester_id
      const profile = profileMap.get(otherId)
      const authInfo = authMap.get(otherId)
      const fallbackUsername = getLocalUsername(otherId)

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
          name: profile?.name || authInfo?.name || (authInfo?.email ? authInfo.email.split('@')[0] : 'Family Member'),
          email: profile?.email || authInfo?.email || null,
          username: profile?.username || fallbackUsername || null,
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

    // Verify target user exists in profiles or auth.users
    let targetName: string | null = null
    let targetEmail: string | null = null
    let targetUsername: string | null = getLocalUsername(target_id)
    let targetDistrict: string | null = null

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', target_id)
        .maybeSingle()

      if (profile) {
        targetName = profile.name
        targetUsername = profile.username || targetUsername
        targetDistrict = profile.district
        targetEmail = profile.email
      }
    } catch {
      // profiles query
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (serviceKey && supabaseUrl) {
      try {
        const adminSupabase = createSupabaseClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
        const { data: targetAuthUser } = await adminSupabase.auth.admin.getUserById(target_id)
        if (targetAuthUser?.user) {
          if (!targetEmail) targetEmail = targetAuthUser.user.email || null
          if (!targetName) targetName = targetAuthUser.user.user_metadata?.name || null
        }
      } catch {
        // auth admin check
      }
    }

    if (!targetName && !targetEmail) {
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

    // Check existing connections
    const computedReverse = (reverse_relation_type || getReciprocalRelation(relation_type)) as RelationType
    let newConnection: StoredFamilyConnection | null = null
    let savedToDb = false

    try {
      const { data: existing } = await supabase
        .from('family_connections')
        .select('*')
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

      if (!insertError && created) {
        newConnection = created as StoredFamilyConnection
        savedToDb = true
      }
    } catch {
      // Table doesn't exist yet in Supabase
    }

    if (!savedToDb) {
      const localConns = getLocalConnections()
      const existingLocal = localConns.find(
        c => (c.requester_id === user.id && c.target_id === target_id) ||
             (c.requester_id === target_id && c.target_id === user.id)
      )

      if (existingLocal) {
        if (existingLocal.status === 'accepted') {
          return NextResponse.json<ApiError>(
            {
              success: false,
              error: 'You are already connected with this family member',
              error_bn: 'আপনি ইতিমধ্যে এই পরিবারের সদস্যের সাথে সংযুক্ত',
              code: 'ALREADY_CONNECTED'
            },
            { status: 409 }
          )
        } else if (existingLocal.status === 'pending') {
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

      newConnection = {
        id: crypto.randomUUID(),
        requester_id: user.id,
        target_id,
        relation_type,
        reverse_relation_type: computedReverse,
        status: 'pending',
        created_at: new Date().toISOString(),
        accepted_at: null,
      }

      localConns.push(newConnection)
      saveLocalConnections(localConns)
    }

    if (!newConnection) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Failed to send invitation', code: 'INSERT_FAILED' },
        { status: 500 }
      )
    }

    const result: FamilyConnection = {
      id: newConnection.id,
      requester_id: newConnection.requester_id,
      target_id: newConnection.target_id,
      relation_type: newConnection.relation_type,
      reverse_relation_type: newConnection.reverse_relation_type,
      status: newConnection.status,
      created_at: newConnection.created_at,
      accepted_at: newConnection.accepted_at,
      other_user: {
        id: target_id,
        name: targetName || (targetEmail ? targetEmail.split('@')[0] : 'Family Member'),
        email: targetEmail,
        username: targetUsername,
        district: targetDistrict,
      },
      is_requester: true,
    }

    return NextResponse.json<ApiSuccess<FamilyConnection>>({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[family/connections] Unhandled error on POST:', error)
    return NextResponse.json<ApiError>(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
