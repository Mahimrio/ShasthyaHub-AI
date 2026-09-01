import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiError, ApiSuccess, UserSearchResult } from '@/types'

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
    const query = (searchParams.get('q') || '').trim()

    if (!query || query.length < 2) {
      return NextResponse.json<ApiSuccess<UserSearchResult[]>>({
        success: true,
        data: []
      })
    }

    // Search profiles by username or name
    const { data: profiles, error: searchError } = await supabase
      .from('profiles')
      .select('id, name, username, district')
      .neq('id', user.id)
      .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(10)

    if (searchError) {
      console.error('[family/search] DB search error:', searchError)
      return NextResponse.json<ApiError>(
        { success: false, error: 'Failed to search users', code: 'DB_ERROR' },
        { status: 500 }
      )
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json<ApiSuccess<UserSearchResult[]>>({
        success: true,
        data: []
      })
    }

    // Check existing connections with found profiles
    const targetIds = profiles.map(p => p.id)
    const { data: connections } = await supabase
      .from('family_connections')
      .select('id, requester_id, target_id, status')
      .or(
        targetIds.map(tid => `and(requester_id.eq.${user.id},target_id.eq.${tid}),and(requester_id.eq.${tid},target_id.eq.${user.id})`).join(',')
      )

    const connMap = new Map<string, { id: string; status: 'pending' | 'accepted' | 'rejected' }>()
    if (connections) {
      for (const c of connections) {
        const otherId = c.requester_id === user.id ? c.target_id : c.requester_id
        connMap.set(otherId, { id: c.id, status: c.status })
      }
    }

    const results: UserSearchResult[] = profiles.map(p => {
      const conn = connMap.get(p.id)
      return {
        id: p.id,
        name: p.name,
        username: p.username,
        district: p.district,
        connectionStatus: conn ? conn.status : 'none',
        existingConnectionId: conn ? conn.id : undefined,
      }
    })

    return NextResponse.json<ApiSuccess<UserSearchResult[]>>({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('[family/search] Unhandled error:', error)
    return NextResponse.json<ApiError>(
      { success: false, error: 'Server error searching family members', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
