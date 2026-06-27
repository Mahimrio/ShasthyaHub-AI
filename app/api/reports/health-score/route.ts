import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiError } from '@/types'

export const dynamic = 'force-dynamic'

interface HealthScoreResponse {
  score: number | null
  eye_score: number | null
  food_score: number | null
  rx_score: number | null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const iso = thirtyDaysAgo.toISOString()

    const [eyeRes, foodRes, rxRes] = await Promise.all([
      supabase
        .from('eye_analyses')
        .select('severity')
        .eq('user_id', user.id)
        .gte('created_at', iso)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('food_analyses')
        .select('risk_level')
        .eq('user_id', user.id)
        .gte('created_at', iso)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('prescription_analyses')
        .select('has_dangerous_interactions')
        .eq('user_id', user.id)
        .gte('created_at', iso)
        .order('created_at', { ascending: false })
        .limit(1),
    ])

    const eyeScore = (() => {
      const sev = eyeRes.data?.[0]?.severity?.toLowerCase()
      if (!sev) return null
      if (sev === 'critical') return 10
      if (sev === 'high') return 40
      if (sev === 'medium') return 65
      if (sev === 'low') return 80
      if (sev === 'normal') return 100
      return null
    })()

    const foodScore = (() => {
      const risk = foodRes.data?.[0]?.risk_level?.toLowerCase()
      if (!risk) return null
      if (risk === 'red') return 30
      if (risk === 'yellow') return 65
      if (risk === 'green') return 100
      return null
    })()

    const rxScore = (() => {
      const dangerous = rxRes.data?.[0]?.has_dangerous_interactions
      if (dangerous === undefined || dangerous === null) return null
      if (dangerous) return 20
      return 100
    })()

    // Weighted composite
    const weights: { score: number; weight: number }[] = []
    if (eyeScore !== null) weights.push({ score: eyeScore, weight: 0.4 })
    if (foodScore !== null) weights.push({ score: foodScore, weight: 0.35 })
    if (rxScore !== null) weights.push({ score: rxScore, weight: 0.25 })

    const totalWeight = weights.reduce((s, w) => s + w.weight, 0)
    const composite = totalWeight > 0
      ? Math.round(weights.reduce((s, w) => s + w.score * w.weight, 0) / totalWeight)
      : null

    return NextResponse.json<{ success: true; data: HealthScoreResponse }>({
      success: true,
      data: { score: composite, eye_score: eyeScore, food_score: foodScore, rx_score: rxScore },
    })
  } catch (error) {
    console.error('[health-score] failed:', error)
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to compute health score', code: 'SCORE_ERROR' },
      { status: 500 }
    )
  }
}
