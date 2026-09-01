import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { RELATIONS_MAP, getRelationLabel } from '@/lib/family/relations'
import { getLocalConnections, getLocalUsername, type StoredFamilyConnection } from '@/lib/family/store'
import type {
  ApiError,
  ApiSuccess,
  FamilyMemberHealthSummary,
  FamilyTreeNode,
  RelationType,
} from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 1. Fetch all accepted family connections
    let connections: StoredFamilyConnection[] = []
    let usedDb = false

    try {
      const { data: dbConns, error: connError } = await supabase
        .from('family_connections')
        .select('*')
        .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
        .eq('status', 'accepted')

      if (!connError && dbConns) {
        connections = dbConns as StoredFamilyConnection[]
        usedDb = true
      }
    } catch {
      // Table doesn't exist yet
    }

    if (!usedDb) {
      const localConns = getLocalConnections()
      connections = localConns.filter(
        c => (c.requester_id === user.id || c.target_id === user.id) && c.status === 'accepted'
      )
    }

    const memberIds = Array.from(
      new Set([
        user.id,
        ...connections.map(c => (c.requester_id === user.id ? c.target_id : c.requester_id)),
      ])
    )

    // 2. Fetch profiles for all members using select('*')
    const { data: memberProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', memberIds)

    const profileMap = new Map((memberProfiles || []).map(p => [p.id, p]))

    // 3. Fetch auth users for email/name fallback
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

    // 4. Fetch health summaries for all members (prescriptions, eye, food)
    const [eyeRes, rxRes, foodRes] = await Promise.all([
      supabase
        .from('eye_analyses')
        .select('user_id, severity, created_at')
        .in('user_id', memberIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('prescription_analyses')
        .select('user_id, extracted_drugs, digital_schedule, has_dangerous_interactions, created_at')
        .in('user_id', memberIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('food_analyses')
        .select('user_id, risk_level, created_at')
        .in('user_id', memberIds)
        .order('created_at', { ascending: false }),
    ])

    // Build health overview per user
    const userHealthMap = new Map<string, FamilyMemberHealthSummary>()

    for (const mId of memberIds) {
      const isSelf = mId === user.id
      const p = profileMap.get(mId)
      const authInfo = authMap.get(mId)
      const fallbackUsername = getLocalUsername(mId)

      // Find relation relative to current user
      let relation: RelationType = 'Other'
      if (isSelf) {
        relation = 'Other'
      } else {
        const conn = connections.find(
          c => (c.requester_id === user.id && c.target_id === mId) || (c.target_id === user.id && c.requester_id === mId)
        )
        if (conn) {
          relation = conn.requester_id === user.id ? (conn.relation_type as RelationType) : (conn.reverse_relation_type as RelationType)
        }
      }

      const userEyes = (eyeRes.data || []).filter(e => e.user_id === mId)
      const userRxs = (rxRes.data || []).filter(r => r.user_id === mId)
      const userFoods = (foodRes.data || []).filter(f => f.user_id === mId)

      const latestEye = userEyes[0]
      const latestRx = userRxs[0]
      const latestFood = userFoods[0]

      const hasUrgentEye = userEyes.some(e => e.severity === 'High' || e.severity === 'Critical')
      const hasDangerousInteraction = userRxs.some(r => r.has_dangerous_interactions === true)
      const hasUrgentDiet = userFoods.some(f => f.risk_level === 'Red')

      // Extract active medications from latest prescription
      const activeMedications: {
        name: string
        dosage: string
        frequency: string
        scheduleSlot?: 'morning' | 'afternoon' | 'evening' | 'night'
      }[] = []

      if (latestRx && latestRx.extracted_drugs && Array.isArray(latestRx.extracted_drugs)) {
        for (const drug of latestRx.extracted_drugs) {
          const schedule = latestRx.digital_schedule?.schedule?.find(
            (s: { medication_name: string }) =>
              s.medication_name?.toLowerCase() === (drug.brand_name || drug.generic_name || drug.written_text)?.toLowerCase()
          )

          activeMedications.push({
            name: drug.brand_name || drug.generic_name || drug.written_text || 'Medication',
            dosage: drug.dosage || '',
            frequency: drug.frequency || '',
            scheduleSlot: schedule?.timing as ('morning' | 'afternoon' | 'evening' | 'night') | undefined,
          })
        }
      }

      const allDates = [
        ...userEyes.map(e => e.created_at),
        ...userRxs.map(r => r.created_at),
        ...userFoods.map(f => f.created_at),
      ].sort().reverse()

      userHealthMap.set(mId, {
        userId: mId,
        name: isSelf
          ? (p?.name || authInfo?.name || user.user_metadata?.name || 'You')
          : (p?.name || authInfo?.name || (authInfo?.email ? authInfo.email.split('@')[0] : 'Family Member')),
        email: p?.email || authInfo?.email || (isSelf ? user.email : null),
        username: p?.username || fallbackUsername || null,
        relation,
        relationBn: getRelationLabel(relation, 'bn'),
        district: p?.district || null,
        isCurrentUser: isSelf,
        totalPrescriptions: userRxs.length,
        totalEyeAnalyses: userEyes.length,
        totalFoodAnalyses: userFoods.length,
        hasUrgentCondition: hasUrgentEye || hasDangerousInteraction || hasUrgentDiet,
        lastActive: allDates[0] || null,
        activeMedications,
        latestHealthStatus: {
          eyeSeverity: latestEye?.severity || null,
          dietRisk: latestFood?.risk_level || null,
          hasDangerousInteraction: latestRx?.has_dangerous_interactions || false,
        },
      })
    }

    // 5. Organize into hierarchical Family Tree nodes
    const rootNodes: FamilyTreeNode[] = []

    // Add Self as root/center
    const selfHealth = userHealthMap.get(user.id)
    const selfNode: FamilyTreeNode = {
      id: `node-${user.id}`,
      userId: user.id,
      name: selfHealth?.name || 'You',
      email: selfHealth?.email || user.email,
      username: selfHealth?.username || null,
      relation: 'Other',
      relationBn: 'আপনি',
      generation: 0,
      isCurrentUser: true,
      healthSummary: selfHealth,
      children: [],
    }

    // Add connected family members grouped by generation
    for (const mId of memberIds) {
      if (mId === user.id) continue
      const health = userHealthMap.get(mId)
      if (!health) continue

      const relationMeta = RELATIONS_MAP[health.relation]
      const generation = relationMeta ? relationMeta.generation : 0

      const memberNode: FamilyTreeNode = {
        id: `node-${mId}`,
        userId: mId,
        name: health.name,
        email: health.email,
        username: health.username,
        relation: health.relation,
        relationBn: health.relationBn,
        generation,
        isCurrentUser: false,
        healthSummary: health,
      }

      rootNodes.push(memberNode)
    }

    // Return the tree structure
    return NextResponse.json<ApiSuccess<{
      self: FamilyTreeNode
      members: FamilyTreeNode[]
      totalConnected: number
      hasUrgentAlerts: boolean
    }>>({
      success: true,
      data: {
        self: selfNode,
        members: rootNodes,
        totalConnected: rootNodes.length,
        hasUrgentAlerts: Array.from(userHealthMap.values()).some(h => h.hasUrgentCondition),
      },
    })
  } catch (error) {
    console.error('[family/tree] Unhandled error:', error)
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to build family tree', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
