'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import type { ChatMsg, RedFlagLevel } from './useChat'
import type { ChatAgent, ScopedChatContext, ScopedChatOptions } from '@/types'

const CACHE_CAP = 30
const cacheKey = (uid: string, agent: ChatAgent, contextId: string) => `shasthya_chat_v1:${uid}:${agent}:${contextId}`

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
}

/**
 * Conversation state for one page-scoped composer: streaming send, retry,
 * localStorage cache, Supabase hydration by (scope, context_id).
 */
export function useScopedChat({ agent, contextId, getContext, options }: UseScopedChatArgs) {
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
  }, [messages, user?.id, agent, contextId])

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
          body: JSON.stringify({ agent, lang, contextId, context: getContext(), options, messages: outbound }),
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
    try {
      localStorage.removeItem(cacheKey(user.id, agent, contextId))
    } catch {
      // ignore
    }
    import('@/lib/supabase/client')
      .then(({ createClient }) =>
        createClient().from('chat_messages').delete().eq('user_id', user.id).eq('scope', agent).eq('context_id', contextId)
      )
      .catch(() => {})
  }, [user?.id, agent, contextId])

  return { messages, send, retry, stop, clear, isStreaming, redFlag, error, canRetry: failedText !== null }
}
