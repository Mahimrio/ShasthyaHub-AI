import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RELATIONS_MAP, getRelationLabel } from '@/lib/family/relations'
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

    // 2. Fetch all accepted family connections
    const { data: connections, error: connError } = await supabase
      .from('family_connections')
      .select('*')
      .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
      .eq('status', 'accepted')

    if (connError) {
      console.error('[family/tree] Error fetching connections:', connError)
      return NextResponse.json<ApiError>(
        { success: false, error: 'Failed to build family tree', code: 'DB_ERROR' },
        { status: 500 }
      )
    }

    const memberIds = Array.from(
      new Set([
        user.id,
        ...(connections || []).map(c => (c.requester_id === user.id ? c.target_id : c.requester_id)),
      ])
    )

    // 3. Fetch profiles for all members
    const { data: memberProfiles } = await supabase
      .from('profiles')
      .select('id, name, username, district')
      .in('id', memberIds)

    const profileMap = new Map(memberProfiles?.map(p => [p.id, p]) || [])

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

      // Find relation relative to current user
      let relation: RelationType = 'Other'
      if (isSelf) {
        relation = 'Other'
      } else {
        const conn = (connections || []).find(
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

      // Extract active medications from the latest prescription
      const activeMedications: FamilyMemberHealthSummary['activeMedications'] = []
      if (latestRx?.extracted_drugs && Array.isArray(latestRx.extracted_drugs)) {
        for (const drug of latestRx.extracted_drugs.slice(0, 4)) {
          activeMedications.push({
            name: drug.brand_name || drug.generic_name || drug.written_text || 'Medication',
            dosage: drug.dosage || '',
            frequency: drug.frequency || '',
          })
        }
      }

      // Check for urgent conditions (e.g. Critical/High eye severity, dangerous rx interaction, Red food risk)
      const hasUrgentCondition =
        latestEye?.severity === 'Critical' ||
        latestEye?.severity === 'High' ||
        latestRx?.has_dangerous_interactions === true ||
        latestFood?.risk_level === 'Red'

      const allDates = [
        latestEye?.created_at,
        latestRx?.created_at,
        latestFood?.created_at,
      ].filter(Boolean) as string[]

      const lastActive = allDates.length > 0
        ? allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        : null

      userHealthMap.set(mId, {
        userId: mId,
        name: isSelf ? (p?.name || 'You') : (p?.name || 'Family Member'),
        username: p?.username ?? null,
        relation,
        relationBn: isSelf ? 'আমি (স্বয়ং)' : getRelationLabel(relation, 'bn'),
        district: p?.district ?? null,
        isCurrentUser: isSelf,
        totalPrescriptions: userRxs.length,
        totalEyeAnalyses: userEyes.length,
        totalFoodAnalyses: userFoods.length,
        hasUrgentCondition,
        lastActive,
        activeMedications,
        latestHealthStatus: {
          eyeSeverity: latestEye?.severity ?? null,
          dietRisk: latestFood?.risk_level ?? null,
          hasDangerousInteraction: latestRx?.has_dangerous_interactions ?? false,
        },
      })
    }

    // 5. Structure nodes by generation
    const nodes: FamilyTreeNode[] = memberIds.map(mId => {
      const isSelf = mId === user.id
      const p = profileMap.get(mId)
      const health = userHealthMap.get(mId)!
      const relation = health.relation
      const relMeta = RELATIONS_MAP[relation] || RELATIONS_MAP.Other
      const generation = isSelf ? 0 : relMeta.generation

      return {
        id: mId,
        userId: mId,
        name: isSelf ? (p?.name || 'You') : (p?.name || 'Family Member'),
        username: p?.username ?? null,
        relation: isSelf ? 'Other' : relation,
        relationBn: isSelf ? 'আমি' : getRelationLabel(relation, 'bn'),
        generation,
        isCurrentUser: isSelf,
        healthSummary: health,
      }
    })

    const selfNode = nodes.find(n => n.isCurrentUser) || nodes[0]
    const otherNodes = nodes.filter(n => !n.isCurrentUser)

    // Group into generations
    const generations: Record<string, FamilyTreeNode[]> = {
      grandparents: nodes.filter(n => n.generation === -2),
      parents: nodes.filter(n => n.generation === -1),
      peers: nodes.filter(n => n.generation === 0),
      children: nodes.filter(n => n.generation === 1),
      grandchildren: nodes.filter(n => n.generation === 2),
    }

    return NextResponse.json<
      ApiSuccess<{
        self: FamilyTreeNode
        allNodes: FamilyTreeNode[]
        otherNodes: FamilyTreeNode[]
        generations: Record<string, FamilyTreeNode[]>
        totalMembers: number
      }>
    >({
      success: true,
      data: {
        self: selfNode,
        allNodes: nodes,
        otherNodes,
        generations,
        totalMembers: nodes.length,
      },
    })
  } catch (error) {
    console.error('[family/tree] Unhandled error:', error)
    return NextResponse.json<ApiError>(
      { success: false, error: 'Internal server error building tree', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
