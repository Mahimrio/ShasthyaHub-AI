import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { sanitizeInput } from '@/lib/sanitize'
import {
  buildChatSystemPrompt,
  detectRedFlags,
  trimHistory,
  openRouterChatText,
  geminiChatText,
  type ChatTurn,
} from '@/lib/ai/chat'
import type { ApiError } from '@/types'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const GROQ_CHAT_MODEL = 'openai/gpt-oss-120b'
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

    // Pick a provider up-front so headers can carry it. Groq streams; the
    // fallbacks return whole texts that we emit as a single chunk.
    let provider: 'groq' | 'openrouter' | 'gemini' = 'groq'
    let groqStream: AsyncIterable<Groq.Chat.Completions.ChatCompletionChunk> | null = null
    let fallbackText: string | null = null

    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
      groqStream = await groq.chat.completions.create({
        model: GROQ_CHAT_MODEL,
        messages: [{ role: 'system', content: system }, ...trimmed],
        stream: true,
        temperature: 0.4,
        max_completion_tokens: 1024,
        reasoning_effort: 'low',
      })
    } catch (groqError) {
      console.warn('[chat] Groq failed, falling back:', groqError instanceof Error ? groqError.message : groqError)
      try {
        fallbackText = await openRouterChatText(system, trimmed)
        provider = 'openrouter'
      } catch (orError) {
        console.warn('[chat] OpenRouter failed, falling back to Gemini:', orError instanceof Error ? orError.message : orError)
        fallbackText = await geminiChatText(system, trimmed)
        provider = 'gemini'
      }
    }

    const encoder = new TextEncoder()
    const userContent = last.content

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let full = ''
        try {
          if (groqStream) {
            for await (const chunk of groqStream) {
              const delta = chunk.choices[0]?.delta?.content || ''
              if (delta) {
                full += delta
                controller.enqueue(encoder.encode(delta))
              }
            }
          } else if (fallbackText) {
            full = fallbackText
            controller.enqueue(encoder.encode(fallbackText))
          }
        } catch (streamError) {
          console.error('[chat] stream interrupted:', streamError)
        } finally {
          controller.close()
        }

        // Persist after the stream ends; tolerate a missing table (003 not run).
        if (full.trim()) {
          const { error: insertError } = await supabase.from('chat_messages').insert([
            { user_id: user.id, role: 'user', content: userContent, lang },
            { user_id: user.id, role: 'assistant', content: full, lang },
          ])
          if (insertError) console.warn('[chat] persistence skipped:', insertError.message)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'x-provider': provider,
        'x-red-flag': redFlag,
      },
    })
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
