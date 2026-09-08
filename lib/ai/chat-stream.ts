import Groq from 'groq-sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { openRouterChatText, geminiChatText, type ChatTurn } from './chat'
import type { ChatScope } from '@/types'

/**
 * Plain-text chat plumbing shared by the global Shasthya Bondhu route and the
 * page-scoped composers: Groq streams, OpenRouter/Gemini return whole texts.
 */

export const GROQ_CHAT_MODEL = 'openai/gpt-oss-120b'

export type ChatProvider = 'groq' | 'openrouter' | 'gemini'

export interface ChatCompletion {
  provider: ChatProvider
  groqStream: AsyncIterable<Groq.Chat.Completions.ChatCompletionChunk> | null
  fallbackText: string | null
}

export async function runChatCompletion(
  system: string,
  history: ChatTurn[],
  { maxTokens = 1024, tag = 'chat' }: { maxTokens?: number; tag?: string } = {}
): Promise<ChatCompletion> {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const groqStream = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: [{ role: 'system', content: system }, ...history],
      stream: true,
      temperature: 0.4,
      max_completion_tokens: maxTokens,
      reasoning_effort: 'low',
    })
    return { provider: 'groq', groqStream, fallbackText: null }
  } catch (groqError) {
    console.warn(`[${tag}] Groq failed, falling back:`, groqError instanceof Error ? groqError.message : groqError)
  }

  try {
    return { provider: 'openrouter', groqStream: null, fallbackText: await openRouterChatText(system, history, maxTokens) }
  } catch (orError) {
    console.warn(`[${tag}] OpenRouter failed, falling back to Gemini:`, orError instanceof Error ? orError.message : orError)
  }

  return { provider: 'gemini', groqStream: null, fallbackText: await geminiChatText(system, history) }
}

export interface ChatPersistence {
  supabase: SupabaseClient
  userId: string
  lang: 'bn' | 'en'
  scope: ChatScope
  contextId?: string | null
  userContent: string
  tag?: string
}

async function persistExchange(p: ChatPersistence, reply: string) {
  const base = { user_id: p.userId, lang: p.lang }
  const scoped = { scope: p.scope, context_id: p.contextId ?? null }
  const rows = [
    { ...base, ...scoped, role: 'user', content: p.userContent },
    { ...base, ...scoped, role: 'assistant', content: reply },
  ]
  const { error } = await p.supabase.from('chat_messages').insert(rows)
  if (!error) return

  // Before migration 007 the scope columns don't exist; keep the global widget's history working.
  if (p.scope === 'global' && /scope|context_id/.test(error.message)) {
    const legacy = rows.map(({ scope: _s, context_id: _c, ...r }) => r)
    const { error: legacyError } = await p.supabase.from('chat_messages').insert(legacy)
    if (!legacyError) return
  }
  console.warn(`[${p.tag ?? 'chat'}] persistence skipped:`, error.message)
}

/**
 * Streams the reply as text/plain. Errors the stream (instead of closing) on
 * failure so the client can show a retry, and persists only complete exchanges.
 */
export function streamChatResponse(
  completion: ChatCompletion,
  persistence: ChatPersistence,
  headers: Record<string, string> = {}
): Response {
  const encoder = new TextEncoder()
  const tag = persistence.tag ?? 'chat'

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = ''
      let completed = false
      try {
        if (completion.groqStream) {
          for await (const chunk of completion.groqStream) {
            const delta = chunk.choices[0]?.delta?.content || ''
            if (delta) {
              full += delta
              controller.enqueue(encoder.encode(delta))
            }
          }
        } else if (completion.fallbackText) {
          full = completion.fallbackText
          controller.enqueue(encoder.encode(completion.fallbackText))
        }
        completed = true
        controller.close()
      } catch (streamError) {
        console.error(`[${tag}] stream interrupted:`, streamError)
        controller.error(streamError)
      }

      if (completed && full.trim()) await persistExchange(persistence, full)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'x-provider': completion.provider,
      ...headers,
    },
  })
}
