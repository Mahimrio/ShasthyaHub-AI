import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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
    const rawQuery = (searchParams.get('q') || '').trim()
    const query = rawQuery.replace(/^@/, '').toLowerCase()

    if (!query || query.length < 2) {
      return NextResponse.json<ApiSuccess<UserSearchResult[]>>({
        success: true,
        data: []
      })
    }

    // Map of matching user IDs to preliminary results
    const foundMap = new Map<string, { id: string; name: string | null; email: string | null; username: string | null; district: string | null }>()

    // 1. Search via Supabase Admin Auth users by Gmail/Email if service role key is available
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
            if (u.id === user.id) continue
            const userEmail = (u.email || '').toLowerCase()
            const userName = (u.user_metadata?.name || '').toLowerCase()

            if (userEmail.includes(query) || userName.includes(query)) {
              foundMap.set(u.id, {
                id: u.id,
                name: u.user_metadata?.name || null,
                email: u.email || null,
                username: null,
                district: null,
              })
            }
          }
        }
      } catch (adminErr) {
        console.warn('[family/search] Admin auth list error:', adminErr)
      }
    }

    // 2. Search profiles table by username, name, or email
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .or(`name.ilike.%${query}%,district.ilike.%${query}%`)
        .limit(15)

      if (profiles) {
        for (const p of profiles) {
          const existing = foundMap.get(p.id)
          foundMap.set(p.id, {
            id: p.id,
            name: p.name || existing?.name || null,
            email: p.email || existing?.email || null,
            username: p.username || existing?.username || null,
            district: p.district || existing?.district || null,
          })
        }
      }
    } catch {
      // profiles query fallback
    }

    // 3. For any found users that don't have profile data yet, fetch their profiles
    const allFoundIds = Array.from(foundMap.keys()).slice(0, 15)

    if (allFoundIds.length === 0) {
      return NextResponse.json<ApiSuccess<UserSearchResult[]>>({
        success: true,
        data: []
      })
    }

    try {
      const { data: fetchedProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', allFoundIds)

      if (fetchedProfiles) {
        for (const p of fetchedProfiles) {
          const existing = foundMap.get(p.id)
          if (existing) {
            existing.name = p.name || existing.name
            existing.username = p.username || existing.username
            existing.district = p.district || existing.district
            if (p.email) existing.email = p.email
          }
        }
      }
    } catch {
      // Continue with what we have
    }

    // 4. Check existing connections with found users
    const connMap = new Map<string, { id: string; status: 'pending' | 'accepted' | 'rejected' }>()
    try {
      const { data: connections } = await supabase
        .from('family_connections')
        .select('id, requester_id, target_id, status')
        .or(
          allFoundIds.map(tid => `and(requester_id.eq.${user.id},target_id.eq.${tid}),and(requester_id.eq.${tid},target_id.eq.${user.id})`).join(',')
        )

      if (connections) {
        for (const c of connections) {
          const otherId = c.requester_id === user.id ? c.target_id : c.requester_id
          connMap.set(otherId, { id: c.id, status: c.status })
        }
      }
    } catch {
      // family_connections check
    }

    const results: UserSearchResult[] = Array.from(foundMap.values()).map(u => {
      const conn = connMap.get(u.id)
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        district: u.district,
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
