import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { sanitizeInput } from '@/lib/sanitize'
import { buildScopedSystemPrompt, detectRedFlags, trimHistory, type ChatTurn } from '@/lib/ai/chat'
import { runChatCompletion, streamChatResponse } from '@/lib/ai/chat-stream'
import {
  chatAgentSchema,
  describeIdleContext,
  fetchAgentHistory,
  fetchContextFromDb,
  scopedContextSchema,
  serializeScopedContext,
} from '@/lib/ai/scoped-context'
import type { ApiError, ScopedChatOptions } from '@/types'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const MAX_MESSAGE_CHARS = 4000
const MAX_CONTEXT_CHARS = 2400

const bodySchema = z.object({
  agent: chatAgentSchema,
  lang: z.enum(['bn', 'en']).default('bn'),
  contextId: z.string().trim().min(1).max(120),
  context: scopedContextSchema.nullable().default(null),
  options: z
    .object({
      simple: z.boolean().default(false),
      doctorQuestions: z.boolean().default(false),
      includeHistory: z.boolean().default(false),
    })
    .default({ simple: false, doctorQuestions: false, includeHistory: false }),
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).max(40),
})

/**
 * Page-scoped assistant for ScriptGuard / GlycoVision / Lokhon. The client
 * sends the analysis currently on screen; the model may only talk about it.
 */
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

    if (!rateLimit(`chat-scoped:${user.id}`, { windowMs: 60_000, maxRequests: 10 })) {
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

    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Invalid request body.', code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }
    const { agent, lang, contextId, context, options, messages } = parsed.data

    // The context must belong to the agent whose composer sent it.
    if (context && context.agent !== agent) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Context does not match agent.', code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    const history: ChatTurn[] = messages
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
    // A reopened conversation about an earlier analysis arrives without page context; rebuild it from the DB.
    const effectiveContext = context ?? (await fetchContextFromDb(supabase, user.id, agent, contextId))
    const contextBlock = effectiveContext
      ? serializeScopedContext(effectiveContext).slice(0, MAX_CONTEXT_CHARS)
      : describeIdleContext(agent)

    const historyLines = options.includeHistory ? await fetchAgentHistory(supabase, user.id, agent, contextId) : []

    const system = buildScopedSystemPrompt(agent, lang, contextBlock, options as ScopedChatOptions, historyLines)
    // Context already spends part of the budget; keep the conversation window tighter than the global chat.
    const trimmed = trimHistory(history, 4000, 16)

    const completion = await runChatCompletion(system, trimmed, { tag: 'chat-scoped' })

    return streamChatResponse(
      completion,
      { supabase, userId: user.id, lang, scope: agent, contextId, userContent: last.content, tag: 'chat-scoped' },
      { 'x-red-flag': redFlag, 'x-scope': agent }
    )
  } catch (err) {
    console.error('[chat-scoped] Unexpected error:', err)
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
