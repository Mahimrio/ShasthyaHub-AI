'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import type { ChatMsg, RedFlagLevel } from './useChat'
import type { ChatAgent, ScopedChatContext, ScopedChatOptions, ScopedConversation } from '@/types'

const CACHE_CAP = 30
const cacheKey = (uid: string, agent: ChatAgent, contextId: string) => `shasthya_chat_v1:${uid}:${agent}:${contextId}`
const indexKey = (uid: string, agent: ChatAgent) => `shasthya_chat_index_v1:${uid}:${agent}`

type LocalIndex = Record<string, Omit<ScopedConversation, 'contextId' | 'kind'>>

function readIndex(uid: string, agent: ChatAgent): LocalIndex {
  try {
    const parsed = JSON.parse(localStorage.getItem(indexKey(uid, agent)) ?? '{}')
    return parsed && typeof parsed === 'object' ? (parsed as LocalIndex) : {}
  } catch {
    return {}
  }
}

function writeIndex(uid: string, agent: ChatAgent, index: LocalIndex) {
  try {
    localStorage.setItem(indexKey(uid, agent), JSON.stringify(index))
  } catch {
    // storage full — ignore
  }
}

export function conversationKind(contextId: string): ScopedConversation['kind'] {
  if (contextId === 'general') return 'general'
  if (contextId.endsWith(':questionnaire')) return 'questionnaire'
  return 'analysis'
}

/** Conversations cached in this browser for one agent (covers rows never persisted server-side). */
export function readLocalConversationIndex(uid: string, agent: ChatAgent): ScopedConversation[] {
  return Object.entries(readIndex(uid, agent)).map(([contextId, meta]) => ({
    contextId,
    kind: conversationKind(contextId),
    ...meta,
    localOnly: true,
  }))
}

export function removeLocalConversation(uid: string, agent: ChatAgent, contextId: string) {
  const index = readIndex(uid, agent)
  delete index[contextId]
  writeIndex(uid, agent, index)
  try {
    localStorage.removeItem(cacheKey(uid, agent, contextId))
  } catch {
    // ignore
  }
}

const stripMarkdown = (s: string) =>
  s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*+/g, '').replace(/^\s*-\s+/gm, '').replace(/\s+/g, ' ').trim()

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

interface UseScopedChatArgs {
  agent: ChatAgent
  /** Analysis id, or 'general' before one exists. Remount (key) the caller when it changes. */
  contextId: string
  /** Read at send time so HITL edits on the page are always reflected. */
  getContext: () => ScopedChatContext | null
  options: ScopedChatOptions
  /** Shown in the history list for this conversation. */
  label?: string
}

/**
 * Conversation state for one page-scoped composer: streaming send, retry,
 * localStorage cache, Supabase hydration by (scope, context_id).
 */
export function useScopedChat({ agent, contextId, getContext, options, label }: UseScopedChatArgs) {
  const { user } = useAuth()
  const { lang } = useLanguage()
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [redFlag, setRedFlag] = useState<RedFlagLevel>('none')
  const [error, setError] = useState<string | null>(null)
  const [failedText, setFailedText] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const hydratedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!user?.id || hydratedFor.current === user.id) return
    hydratedFor.current = user.id
    const key = cacheKey(user.id, agent, contextId)

    const cached = typeof window !== 'undefined' ? localStorage.getItem(key) : null
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as ChatMsg[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time cache hydration once auth resolves
          setMessages(parsed.slice(-CACHE_CAP))
          return
        }
      } catch {
        // corrupted cache — fall through to Supabase
      }
    }

    const hydrate = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const { data } = await createClient()
          .from('chat_messages')
          .select('id, role, content, created_at')
          .eq('user_id', user.id)
          .eq('scope', agent)
          .eq('context_id', contextId)
          .order('created_at', { ascending: false })
          .limit(20)
        if (data && data.length > 0) {
          setMessages(
            data.reverse().map((r) => ({
              id: r.id,
              role: r.role as 'user' | 'assistant',
              content: r.content,
              at: new Date(r.created_at).getTime(),
            }))
          )
        }
      } catch {
        // migration 007 not applied yet — localStorage-only mode
      }
    }
    hydrate()
  }, [user?.id, agent, contextId])

  useEffect(() => {
    if (!user?.id || messages.length === 0) return
    try {
      localStorage.setItem(cacheKey(user.id, agent, contextId), JSON.stringify(messages.slice(-CACHE_CAP)))
    } catch {
      // storage full — ignore
    }
    const firstUser = messages.find((m) => m.role === 'user')
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && m.content)
    const index = readIndex(user.id, agent)
    index[contextId] = {
      title: (firstUser?.content ?? '').slice(0, 140),
      preview: stripMarkdown(lastAssistant?.content ?? '').slice(0, 160),
      count: messages.length,
      updatedAt: new Date(messages[messages.length - 1].at).toISOString(),
      labelEn: label ?? index[contextId]?.labelEn ?? '',
      labelBn: label ?? index[contextId]?.labelBn ?? '',
    }
    writeIndex(user.id, agent, index)
  }, [messages, user?.id, agent, contextId, label])

  // Abort an in-flight reply if the composer unmounts (page reset / navigation).
  useEffect(() => () => abortRef.current?.abort(), [])

  const sendWith = useCallback(
    async (text: string, base: ChatMsg[]) => {
      const content = text.trim()
      if (!content || isStreaming) return

      setError(null)
      setFailedText(null)
      const userMsg: ChatMsg = { id: newId(), role: 'user', content, at: Date.now() }
      const botMsg: ChatMsg = { id: newId(), role: 'assistant', content: '', at: Date.now() }
      const outbound = [...base, userMsg].map((m) => ({ role: m.role, content: m.content }))
      setMessages([...base, userMsg, botMsg])
      setIsStreaming(true)

      const ac = new AbortController()
      abortRef.current = ac

      const fail = (msg: string) => {
        setMessages((prev) => prev.filter((m) => m.id !== botMsg.id && m.id !== userMsg.id))
        setFailedText(content)
        setError(msg)
      }

      try {
        const res = await fetch('/api/chat/scoped', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent,
            lang,
            contextId,
            context: getContext(),
            // Prior results are cheap (≤3 lines) and let "compared to last time" questions work.
            options: { ...options, includeHistory: true },
            messages: outbound,
          }),
          signal: ac.signal,
        })

        if (!res.ok || !res.body) {
          let msg = lang === 'bn' ? 'চ্যাট এই মুহূর্তে সম্ভব নয়।' : 'Chat is unavailable right now.'
          try {
            const j = await res.json()
            msg = (lang === 'bn' && j.error_bn) || j.error || msg
          } catch {
            // non-JSON error body
          }
          fail(msg)
          return
        }

        setRedFlag((res.headers.get('x-red-flag') as RedFlagLevel) || 'none')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let got = false
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          const delta = decoder.decode(value, { stream: true })
          if (delta) {
            got = true
            setMessages((prev) => prev.map((m) => (m.id === botMsg.id ? { ...m, content: m.content + delta } : m)))
          }
        }
        if (!got) fail(lang === 'bn' ? 'কোনো উত্তর আসেনি — আবার চেষ্টা করুন।' : 'No reply came through — try again.')
      } catch (e) {
        if ((e as Error).name === 'AbortError') {
          // User stopped the reply — keep whatever streamed so far.
          setMessages((prev) => prev.filter((m) => m.id !== botMsg.id || m.content !== ''))
        } else {
          fail(lang === 'bn' ? 'সংযোগ সমস্যা — আবার চেষ্টা করুন।' : 'Connection problem — try again.')
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [agent, contextId, getContext, options, lang, isStreaming]
  )

  const send = useCallback((text: string) => sendWith(text, messages), [sendWith, messages])

  const retry = useCallback(() => {
    if (failedText) void sendWith(failedText, messages)
  }, [failedText, sendWith, messages])

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const clear = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setRedFlag('none')
    setError(null)
    setFailedText(null)
    if (!user?.id) return
    removeLocalConversation(user.id, agent, contextId)
    import('@/lib/supabase/client')
      .then(({ createClient }) =>
        createClient().from('chat_messages').delete().eq('user_id', user.id).eq('scope', agent).eq('context_id', contextId)
      )
      .catch(() => {})
  }, [user?.id, agent, contextId])

  return { messages, send, retry, stop, clear, isStreaming, redFlag, error, canRetry: failedText !== null }
}
