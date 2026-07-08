import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FALLBACK_DISEASES, FALLBACK_QUESTIONS } from '@/lib/services/lokhon-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: diseases, error: dErr } = await supabase
      .from('lokhon_diseases')
      .select('*')
      .order('slug')

    if (dErr) throw dErr

    const { data: questions, error: qErr } = await supabase
      .from('lokhon_questions')
      .select('*')
      .order('order_index')

    if (qErr) throw qErr

    return NextResponse.json({
      success: true,
      data: { diseases: diseases ?? [], questions: questions ?? [] },
    })
  } catch {
    return NextResponse.json({
      success: true,
      data: { diseases: FALLBACK_DISEASES, questions: FALLBACK_QUESTIONS },
    })
  }
}
