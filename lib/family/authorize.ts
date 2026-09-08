import type { SupabaseClient } from '@supabase/supabase-js'
import { getLocalConnections } from '@/lib/family/store'
import type { RelationType } from '@/types'

export interface AcceptedFamilyLink {
  memberId: string
  /** How the viewer relates to the member (viewer's perspective). */
  relation: RelationType
}

/**
 * Returns the accepted connection between the viewer and a member, or null.
 * Checks Supabase first (RLS-scoped to the viewer), then the local store.
 */
export async function getAcceptedFamilyLink(
  supabase: SupabaseClient,
  viewerId: string,
  memberId: string
): Promise<AcceptedFamilyLink | null> {
  if (!memberId || memberId === viewerId) return null

  try {
    const { data: conn } = await supabase
      .from('family_connections')
      .select('requester_id, target_id, relation_type, reverse_relation_type, status')
      .or(
        `and(requester_id.eq.${viewerId},target_id.eq.${memberId}),and(requester_id.eq.${memberId},target_id.eq.${viewerId})`
      )
      .eq('status', 'accepted')
      .maybeSingle()

    if (conn) {
      return {
        memberId,
        relation: (conn.requester_id === viewerId ? conn.relation_type : conn.reverse_relation_type) as RelationType,
      }
    }
  } catch {
    // Table missing — fall through to local store
  }

  const local = getLocalConnections().find(
    (c) =>
      c.status === 'accepted' &&
      ((c.requester_id === viewerId && c.target_id === memberId) ||
        (c.requester_id === memberId && c.target_id === viewerId))
  )
  if (!local) return null

  return {
    memberId,
    relation: local.requester_id === viewerId ? local.relation_type : local.reverse_relation_type,
  }
}
