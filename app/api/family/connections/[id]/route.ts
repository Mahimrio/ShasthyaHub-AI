import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLocalConnections, saveLocalConnections } from '@/lib/family/store'
import type { ApiError, ApiSuccess } from '@/types'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, reverse_relation_type } = body // action: 'accept' | 'reject'

    if (!action || (action !== 'accept' && action !== 'reject')) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Invalid action (must be accept or reject)', code: 'INVALID_ACTION' },
        { status: 400 }
      )
    }

    let handledInDb = false
    try {
      const { data: connection } = await supabase
        .from('family_connections')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (connection) {
        if (connection.target_id !== user.id) {
          return NextResponse.json<ApiError>(
            {
              success: false,
              error: 'Only the invited user can accept or reject this invitation',
              error_bn: 'শুধুমাত্র আমন্ত্রিত সদস্য এই অনুরোধ গ্রহণ বা প্রত্যাখ্যান করতে পারবেন',
              code: 'FORBIDDEN'
            },
            { status: 403 }
          )
        }

        const updatePayload: Record<string, unknown> = {
          status: action === 'accept' ? 'accepted' : 'rejected',
          ...(action === 'accept' ? { accepted_at: new Date().toISOString() } : {}),
          ...(reverse_relation_type ? { reverse_relation_type } : {}),
        }

        const { error: updateError } = await supabase
          .from('family_connections')
          .update(updatePayload)
          .eq('id', id)

        if (!updateError) {
          handledInDb = true
        }
      }
    } catch {
      // Table doesn't exist yet
    }

    if (!handledInDb) {
      const localConns = getLocalConnections()
      const connIndex = localConns.findIndex(c => c.id === id)
      if (connIndex === -1) {
        return NextResponse.json<ApiError>(
          { success: false, error: 'Connection invitation not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      const connection = localConns[connIndex]
      if (connection.target_id !== user.id) {
        return NextResponse.json<ApiError>(
          {
            success: false,
            error: 'Only the invited user can accept or reject this invitation',
            error_bn: 'শুধুমাত্র আমন্ত্রিত সদস্য এই অনুরোধ গ্রহণ বা প্রত্যাখ্যান করতে পারবেন',
            code: 'FORBIDDEN'
          },
          { status: 403 }
        )
      }

      connection.status = action === 'accept' ? 'accepted' : 'rejected'
      connection.accepted_at = action === 'accept' ? new Date().toISOString() : null
      if (reverse_relation_type) {
        connection.reverse_relation_type = reverse_relation_type
      }

      saveLocalConnections(localConns)
    }

    return NextResponse.json<ApiSuccess<{ id: string; status: string }>>({
      success: true,
      data: { id, status: action === 'accept' ? 'accepted' : 'rejected' }
    })
  } catch (error) {
    console.error('[family/connections/[id]] PATCH error:', error)
    return NextResponse.json<ApiError>(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    let handledInDb = false
    try {
      const { data: connection } = await supabase
        .from('family_connections')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (connection) {
        if (connection.requester_id !== user.id && connection.target_id !== user.id) {
          return NextResponse.json<ApiError>(
            { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
            { status: 403 }
          )
        }

        const { error: deleteError } = await supabase
          .from('family_connections')
          .delete()
          .eq('id', id)

        if (!deleteError) {
          handledInDb = true
        }
      }
    } catch {
      // Table doesn't exist yet
    }

    if (!handledInDb) {
      const localConns = getLocalConnections()
      const connIndex = localConns.findIndex(c => c.id === id)
      if (connIndex === -1) {
        return NextResponse.json<ApiError>(
          { success: false, error: 'Connection not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      const connection = localConns[connIndex]
      if (connection.requester_id !== user.id && connection.target_id !== user.id) {
        return NextResponse.json<ApiError>(
          { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
          { status: 403 }
        )
      }

      localConns.splice(connIndex, 1)
      saveLocalConnections(localConns)
    }

    return NextResponse.json<ApiSuccess<{ id: string; deleted: boolean }>>({
      success: true,
      data: { id, deleted: true }
    })
  } catch (error) {
    console.error('[family/connections/[id]] DELETE error:', error)
    return NextResponse.json<ApiError>(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
