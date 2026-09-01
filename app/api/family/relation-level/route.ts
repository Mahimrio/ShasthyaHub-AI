import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGroq } from '@/lib/ai/groq'
import { inferGenerationFromRelation } from '@/lib/family/relations'
import type { ApiError, ApiSuccess } from '@/types'

export const dynamic = 'force-dynamic'

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
    const { relation } = body

    if (!relation || typeof relation !== 'string') {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Relation string is required', code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    // 1. Fast heuristic lookup
    const heuristicGen = inferGenerationFromRelation(relation)

    // 2. Query AI model for exact generation level (-2, -1, 0, 1, 2)
    let finalGeneration = heuristicGen
    let localizedBn = relation
    let localizedEn = relation

    try {
      const systemPrompt = `You are a genealogy expert. Analyze the given family relation relative to the user (Self = 0).
Determine its generation tier:
-2: Grandparents (Dada, Dadi, Nana, Nani, Grandfather, Grandmother)
-1: Parents, Uncles, Aunts, Guardians, Elders (Father, Mother, Uncle, Aunt, Chacha, Mama, Fupu, Khala)
0: Same generation / Peers (Brother, Sister, Sibling, Husband, Wife, Spouse, Cousin)
1: Children, Nephews, Nieces (Son, Daughter, Nephew, Niece, Bhatija, Bhagne)
2: Grandchildren (Grandson, Granddaughter, Nati, Natni)

Respond with JSON: {"generation": -1, "labelEn": "Uncle", "labelBn": "চাচা"}`

      const parsed: Record<string, unknown> = (await callGroq(
        `Relation: "${relation}"`,
        systemPrompt,
        'openai/gpt-oss-120b',
        150
      )) as Record<string, unknown>

      if (typeof parsed?.generation === 'number' && parsed.generation >= -2 && parsed.generation <= 2) {
        finalGeneration = parsed.generation
        if (typeof parsed.labelEn === 'string') localizedEn = parsed.labelEn
        if (typeof parsed.labelBn === 'string') localizedBn = parsed.labelBn
      }
    } catch {
      // Fallback to heuristic
    }

    return NextResponse.json<ApiSuccess<{
      relation: string
      generation: number
      labelEn: string
      labelBn: string
    }>>({
      success: true,
      data: {
        relation,
        generation: finalGeneration,
        labelEn: localizedEn,
        labelBn: localizedBn,
      }
    })
  } catch (error) {
    console.error('[family/relation-level] Error:', error)
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to resolve relation level', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
