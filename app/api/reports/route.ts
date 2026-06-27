import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiError } from '@/types'

export const dynamic = 'force-dynamic'

interface ReportItem {
  type: 'eye' | 'prescription' | 'food'
  id: string
  summary_en: string
  summary_bn: string
  severity_or_risk: string
  created_at: string
  status: string
}

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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const typeFilter = searchParams.get('type')

    const results: ReportItem[] = []

    if (!typeFilter || typeFilter === 'eye') {
      const { data } = await supabase
        .from('eye_analyses')
        .select('id, recommendation_en, recommendation_bn, severity, created_at, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (data) {
        for (const row of data) {
          results.push({
            type: 'eye',
            id: row.id,
            summary_en: row.recommendation_en ?? '',
            summary_bn: row.recommendation_bn ?? '',
            severity_or_risk: row.severity ?? '',
            created_at: row.created_at,
            status: row.status,
          })
        }
      }
    }

    if (!typeFilter || typeFilter === 'prescription') {
      const { data } = await supabase
        .from('prescription_analyses')
        .select('id, has_dangerous_interactions, created_at, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (data) {
        for (const row of data) {
          results.push({
            type: 'prescription',
            id: row.id,
            summary_en: row.has_dangerous_interactions
              ? 'Dangerous drug interactions detected'
              : 'No dangerous interactions detected',
            summary_bn: row.has_dangerous_interactions
              ? 'বিপজ্জনক ওষুধ মিথস্ক্রিয়া সনাক্ত হয়েছে'
              : 'কোনো বিপজ্জনক মিথস্ক্রিয়া নেই',
            severity_or_risk: row.has_dangerous_interactions ? 'has_dangerous' : 'clean',
            created_at: row.created_at,
            status: row.status,
          })
        }
      }
    }

    if (!typeFilter || typeFilter === 'food') {
      const { data } = await supabase
        .from('food_analyses')
        .select('id, risk_summary_en, risk_summary_bn, risk_level, created_at, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (data) {
        for (const row of data) {
          results.push({
            type: 'food',
            id: row.id,
            summary_en: row.risk_summary_en ?? '',
            summary_bn: row.risk_summary_bn ?? '',
            severity_or_risk: row.risk_level ?? '',
            created_at: row.created_at,
            status: row.status,
          })
        }
      }
    }

    // Sort all by created_at descending
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Apply page slicing on the merged list
    const offset = (page - 1) * limit
    const paginated = results.slice(offset, offset + limit)

    return NextResponse.json({ data: paginated, page, limit, total: results.length })
  } catch (error) {
    console.error('[reports] failed to fetch:', error)
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to fetch reports', code: 'FETCH_ERROR' },
      { status: 500 }
    )
  }
}
