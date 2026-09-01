import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getRelationLabel } from '@/lib/family/relations'
import { getLocalConnections, getLocalUsername } from '@/lib/family/store'
import type { ApiError, ApiSuccess, RelationType } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetMemberId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const isSelf = targetMemberId === user.id

    let connectionInfo: { relation_type: RelationType; status: string } | null = null

    if (!isSelf) {
      // Verify active accepted family connection exists in DB or local store
      let hasDbConn = false
      try {
        const { data: conn } = await supabase
          .from('family_connections')
          .select('*')
          .or(
            `and(requester_id.eq.${user.id},target_id.eq.${targetMemberId}),and(requester_id.eq.${targetMemberId},target_id.eq.${user.id})`
          )
          .eq('status', 'accepted')
          .maybeSingle()

        if (conn) {
          const relation = conn.requester_id === user.id ? (conn.relation_type as RelationType) : (conn.reverse_relation_type as RelationType)
          connectionInfo = { relation_type: relation, status: conn.status }
          hasDbConn = true
        }
      } catch {
        // Table doesn't exist yet
      }

      if (!hasDbConn) {
        const localConns = getLocalConnections()
        const localConn = localConns.find(
          c =>
            ((c.requester_id === user.id && c.target_id === targetMemberId) ||
             (c.requester_id === targetMemberId && c.target_id === user.id)) &&
            c.status === 'accepted'
        )

        if (localConn) {
          const relation = localConn.requester_id === user.id ? localConn.relation_type : localConn.reverse_relation_type
          connectionInfo = { relation_type: relation, status: localConn.status }
        }
      }

      if (!connectionInfo) {
        return NextResponse.json<ApiError>(
          {
            success: false,
            error: 'You do not have permission to view this user\'s health data',
            error_bn: 'এই সদস্যের স্বাস্থ্য তথ্য দেখার অনুমতি আপনার নেই',
            code: 'FORBIDDEN'
          },
          { status: 403 }
        )
      }
    }

    // Fetch target member profile
    let memberName: string | null = null
    let memberEmail: string | null = null
    let memberUsername: string | null = getLocalUsername(targetMemberId)
    let memberDistrict: string | null = null

    try {
      const { data: memberProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetMemberId)
        .maybeSingle()

      if (memberProfile) {
        memberName = memberProfile.name
        memberUsername = memberProfile.username || memberUsername
        memberDistrict = memberProfile.district
        memberEmail = memberProfile.email
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
        const { data: targetAuthUser } = await adminSupabase.auth.admin.getUserById(targetMemberId)
        if (targetAuthUser?.user) {
          if (!memberEmail) memberEmail = targetAuthUser.user.email || null
          if (!memberName) memberName = targetAuthUser.user.user_metadata?.name || null
        }
      } catch {
        // auth admin check
      }
    }

    // Fetch target member's health data
    const [eyeRes, rxRes, foodRes] = await Promise.all([
      supabase
        .from('eye_analyses')
        .select('id, diagnosis, confidence_score, severity, recommendation_en, recommendation_bn, urgency_days, specialist_needed, created_at, status')
        .eq('user_id', targetMemberId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('prescription_analyses')
        .select('id, extracted_drugs, interaction_warnings, digital_schedule, digital_schedule_bn, has_dangerous_interactions, created_at, status')
        .eq('user_id', targetMemberId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('food_analyses')
        .select('id, identified_items, total_calories, total_carbs_g, total_protein_g, total_fat_g, glycemic_load, risk_level, risk_summary_en, risk_summary_bn, chronic_disease_risks, created_at, status')
        .eq('user_id', targetMemberId)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    return NextResponse.json<
      ApiSuccess<{
        member: {
          id: string
          name: string | null
          email: string | null
          username: string | null
          district: string | null
          relation: RelationType
          relationBn: string
          isSelf: boolean
        }
        eyeAnalyses: typeof eyeRes.data
        prescriptions: typeof rxRes.data
        foodAnalyses: typeof foodRes.data
      }>
    >({
      success: true,
      data: {
        member: {
          id: targetMemberId,
          name: memberName || (memberEmail ? memberEmail.split('@')[0] : 'Family Member'),
          email: memberEmail,
          username: memberUsername,
          district: memberDistrict,
          relation: isSelf ? 'Other' : (connectionInfo?.relation_type || 'Other'),
          relationBn: isSelf ? 'স্বয়ং' : getRelationLabel(connectionInfo?.relation_type || 'Other', 'bn'),
          isSelf,
        },
        eyeAnalyses: eyeRes.data || [],
        prescriptions: rxRes.data || [],
        foodAnalyses: foodRes.data || [],
      },
    })
  } catch (error) {
    console.error('[family/member/[id]/reports] Unhandled error:', error)
    return NextResponse.json<ApiError>(
      { success: false, error: 'Internal server error fetching member health data', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
