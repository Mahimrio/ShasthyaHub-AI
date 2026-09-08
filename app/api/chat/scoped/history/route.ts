import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatAgentSchema, isAnalysisContextId, lokhonDiseaseName } from '@/lib/ai/scoped-context'
import type { ApiError, ApiSuccess, ChatAgent, ScopedConversation } from '@/types'

export const dynamic = 'force-dynamic'

const SEVERITY_BN: Record<string, string> = { Normal: 'স্বাভাবিক', Low: 'কম', Medium: 'মাঝারি', High: 'উচ্চ', Critical: 'গুরুতর' }
const BAND_BN: Record<string, string> = { Low: 'কম', Moderate: 'মাঝারি', High: 'উচ্চ', Urgent: 'জরুরি' }

const stripMarkdown = (s: string) =>
  s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*+/g, '').replace(/^\s*-\s+/gm, '').replace(/\s+/g, ' ').trim()

interface Row {
  context_id: string | null
  role: string
  content: string
  created_at: string
}

function groupRows(rows: Row[]): Omit<ScopedConversation, 'kind' | 'labelEn' | 'labelBn'>[] {
  const byContext = new Map<string, Row[]>()
  for (const r of rows) {
    const key = r.context_id ?? 'general'
    const list = byContext.get(key) ?? []
    list.push(r)
    byContext.set(key, list)
  }
  const out: Omit<ScopedConversation, 'kind' | 'labelEn' | 'labelBn'>[] = []
  for (const [contextId, list] of byContext) {
    const asc = [...list].sort((a, b) => a.created_at.localeCompare(b.created_at))
    const firstUser = asc.find((r) => r.role === 'user')
    const lastAssistant = [...asc].reverse().find((r) => r.role === 'assistant')
    out.push({
      contextId,
      title: (firstUser?.content ?? asc[0].content).replace(/\s+/g, ' ').trim().slice(0, 140),
      preview: stripMarkdown(lastAssistant?.content ?? '').slice(0, 160),
      count: asc.length,
      updatedAt: asc[asc.length - 1].created_at,
    })
  }
  return out
}

/** Bilingual one-line labels for the analyses these conversations were about. */
async function labelAnalyses(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  agent: ChatAgent,
  ids: string[]
): Promise<Map<string, { en: string; bn: string }>> {
  const labels = new Map<string, { en: string; bn: string }>()
  if (ids.length === 0) return labels
  try {
    if (agent === 'nayan') {
      const { data } = await supabase.from('eye_analyses').select('id, diagnosis, severity').eq('user_id', userId).in('id', ids)
      for (const r of data ?? []) {
        labels.set(r.id, {
          en: `${r.diagnosis ?? 'Eye screening'} · ${r.severity ?? ''}`.trim(),
          bn: `${r.diagnosis ?? 'চোখের পরীক্ষা'} · ${SEVERITY_BN[r.severity ?? ''] ?? r.severity ?? ''}`.trim(),
        })
      }
    } else if (agent === 'scriptguard') {
      const { data } = await supabase.from('prescription_analyses').select('id, extracted_drugs, interaction_warnings').eq('user_id', userId).in('id', ids)
      for (const r of data ?? []) {
        const n = Array.isArray(r.extracted_drugs) ? r.extracted_drugs.length : 0
        const k = Array.isArray(r.interaction_warnings) ? r.interaction_warnings.length : 0
        labels.set(r.id, { en: `${n} medicines · ${k} interactions`, bn: `${n} টি ওষুধ · ${k} টি মিথস্ক্রিয়া` })
      }
    } else if (agent === 'glycovision') {
      const { data } = await supabase.from('food_analyses').select('id, identified_items, total_calories, glycemic_load').eq('user_id', userId).in('id', ids)
      for (const r of data ?? []) {
        const n = Array.isArray(r.identified_items) ? r.identified_items.length : 0
        const kcal = Math.round(Number(r.total_calories ?? 0))
        const gl = Math.round(Number(r.glycemic_load ?? 0))
        labels.set(r.id, { en: `${n} items · ${kcal} kcal · GL ${gl}`, bn: `${n} টি খাবার · ${kcal} kcal · GL ${gl}` })
      }
    } else {
      const { data } = await supabase.from('lokhon_analyses').select('id, disease_slug, risk_band').eq('user_id', userId).in('id', ids)
      for (const r of data ?? []) {
        const name = lokhonDiseaseName(r.disease_slug ?? '')
        labels.set(r.id, {
          en: `${name.en} · risk band: ${r.risk_band ?? 'n/a'}`,
          bn: `${name.bn} · ঝুঁকি: ${BAND_BN[r.risk_band ?? ''] ?? r.risk_band ?? ''}`,
        })
      }
    }
  } catch (e) {
    console.warn('[chat-scoped/history] label lookup failed:', e)
  }
  return labels
}

function genericLabel(agent: ChatAgent, contextId: string): { kind: ScopedConversation['kind']; en: string; bn: string } {
  if (contextId.endsWith(':questionnaire')) {
    const name = lokhonDiseaseName(contextId.slice(0, -':questionnaire'.length))
    return { kind: 'questionnaire', en: `${name.en} screening`, bn: `${name.bn} পরীক্ষা` }
  }
  if (isAnalysisContextId(contextId)) return { kind: 'analysis', en: 'Earlier result', bn: 'আগের ফলাফল' }
  void agent
  return { kind: 'general', en: 'General questions', bn: 'সাধারণ প্রশ্ন' }
}

/** Earlier conversations of one page composer, newest first. Empty (not an error) before migration 007. */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json<ApiError>({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const agentParsed = chatAgentSchema.safeParse(request.nextUrl.searchParams.get('agent'))
    if (!agentParsed.success) {
      return NextResponse.json<ApiError>({ success: false, error: 'Unknown agent.', code: 'INVALID_INPUT' }, { status: 400 })
    }
    const agent = agentParsed.data

    const { data, error } = await supabase
      .from('chat_messages')
      .select('context_id, role, content, created_at')
      .eq('user_id', user.id)
      .eq('scope', agent)
      .order('created_at', { ascending: false })
      .limit(400)

    if (error || !data) {
      return NextResponse.json<ApiSuccess<{ conversations: ScopedConversation[] }>>({ success: true, data: { conversations: [] } })
    }

    const grouped = groupRows(data as Row[])
    const analysisIds = grouped.map((g) => g.contextId).filter(isAnalysisContextId)
    const analysisLabels = await labelAnalyses(supabase, user.id, agent, analysisIds)

    const conversations: ScopedConversation[] = grouped
      .map((g) => {
        const generic = genericLabel(agent, g.contextId)
        const resolved = analysisLabels.get(g.contextId)
        return { ...g, kind: generic.kind, labelEn: resolved?.en ?? generic.en, labelBn: resolved?.bn ?? generic.bn }
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

    return NextResponse.json<ApiSuccess<{ conversations: ScopedConversation[] }>>({ success: true, data: { conversations } })
  } catch (err) {
    console.error('[chat-scoped/history] Unexpected error:', err)
    return NextResponse.json<ApiError>({ success: false, error: 'Could not load history.', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
