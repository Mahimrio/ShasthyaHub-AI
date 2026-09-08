import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { sanitizeInput } from '@/lib/sanitize'
import { buildChatSystemPrompt, detectRedFlags, trimHistory, type ChatTurn } from '@/lib/ai/chat'
import { runChatCompletion, streamChatResponse } from '@/lib/ai/chat-stream'
import type { ApiError } from '@/types'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const MAX_MESSAGE_CHARS = 4000

interface ChatRequestBody {
  messages: ChatTurn[]
  lang?: 'bn' | 'en'
}

/** One-line summaries of the user's latest analyses for prompt context. */
async function fetchReportContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  lang: 'bn' | 'en'
): Promise<string[]> {
  const lines: { at: string; line: string }[] = []
  const clip = (s: string | null | undefined) => (s || '').replace(/\s+/g, ' ').slice(0, 120)
  const day = (iso: string) => iso.slice(0, 10)

  try {
    const [eye, rx, food] = await Promise.all([
      supabase
        .from('eye_analyses')
        .select('recommendation_en, recommendation_bn, severity, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(2),
      supabase
        .from('prescription_analyses')
        .select('has_dangerous_interactions, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(2),
      supabase
        .from('food_analyses')
        .select('risk_summary_en, risk_summary_bn, risk_level, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(2),
    ])

    for (const row of eye.data || []) {
      lines.push({
        at: row.created_at,
        line: `- [${day(row.created_at)}] Eye screening (Nayan AI): severity ${row.severity ?? 'n/a'} — ${clip(lang === 'bn' ? row.recommendation_bn : row.recommendation_en)}`,
      })
    }
    for (const row of rx.data || []) {
      lines.push({
        at: row.created_at,
        line: `- [${day(row.created_at)}] Prescription check (ScriptGuard): ${row.has_dangerous_interactions ? 'DANGEROUS drug interactions found' : 'no dangerous interactions'}`,
      })
    }
    for (const row of food.data || []) {
      lines.push({
        at: row.created_at,
        line: `- [${day(row.created_at)}] Food analysis (GlycoVision): risk ${row.risk_level ?? 'n/a'} — ${clip(lang === 'bn' ? row.risk_summary_bn : row.risk_summary_en)}`,
      })
    }
  } catch (e) {
    console.warn('[chat] report context fetch failed:', e)
  }

  return lines
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 5)
    .map((l) => l.line)
}

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

    if (!rateLimit(`chat:${user.id}`, { windowMs: 60_000, maxRequests: 10 })) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: 'Too many messages. Please wait a minute.',
          error_bn: 'অনেক বেশি বার্তা। এক মিনিট অপেক্ষা করুন।',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      )
    }

    const body = (await request.json()) as ChatRequestBody
    const lang: 'bn' | 'en' = body.lang === 'en' ? 'en' : 'bn'
    const raw = Array.isArray(body.messages) ? body.messages : []

    const history: ChatTurn[] = raw
      .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string')
      .slice(-24)
      .map((m) => ({ role: m.role, content: sanitizeInput(m.content).slice(0, MAX_MESSAGE_CHARS) }))
      .filter((m) => m.content.length > 0)

    const last = history[history.length - 1]
    if (!last || last.role !== 'user') {
      return NextResponse.json<ApiError>(
        { success: false, error: 'A user message is required.', code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    const redFlag = detectRedFlags(last.content)

    const [{ data: profile }, reportLines] = await Promise.all([
      supabase.from('profiles').select('name, district').eq('id', user.id).maybeSingle(),
      fetchReportContext(supabase, user.id, lang),
    ])

    const system = buildChatSystemPrompt(lang, profile, reportLines)
    const trimmed = trimHistory(history)

    const completion = await runChatCompletion(system, trimmed)

    return streamChatResponse(
      completion,
      { supabase, userId: user.id, lang, scope: 'global', userContent: last.content },
      { 'x-red-flag': redFlag }
    )
  } catch (err) {
    console.error('[chat] Unexpected error:', err)
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: 'Chat is unavailable right now. Please try again.',
        error_bn: 'চ্যাট এই মুহূর্তে সম্ভব নয়। আবার চেষ্টা করুন।',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
