'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import { useLanguage } from '@/contexts/LanguageContext'

export type RedFlagLevel = 'none' | 'emergency' | 'self-harm'

export interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  content: string
  at: number
}

const CACHE_CAP = 50
const cacheKey = (uid: string) => `shasthya_chat_v1:${uid}`

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Shasthya Bondhu chat state: streaming send, localStorage cache for instant
 * load, Supabase hydration when the cache is empty (table 003).
 */
export function useChat() {
  const { user } = useAuth()
  const { lang } = useLanguage()
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [redFlag, setRedFlag] = useState<RedFlagLevel>('none')
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const hydratedFor = useRef<string | null>(null)

  // Hydrate: localStorage first, Supabase when the cache is empty.
  useEffect(() => {
    if (!user?.id || hydratedFor.current === user.id) return
    hydratedFor.current = user.id

    const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey(user.id)) : null
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
        const supabase = createClient()
        const { data } = await supabase
          .from('chat_messages')
          .select('id, role, content, created_at')
          .eq('user_id', user.id)
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
        // table may not exist yet — localStorage-only mode is fine
      }
    }
    hydrate()
  }, [user?.id])

  // Persist the rolling window locally.
  useEffect(() => {
    if (!user?.id || messages.length === 0) return
    try {
      localStorage.setItem(cacheKey(user.id), JSON.stringify(messages.slice(-CACHE_CAP)))
    } catch {
      // storage full — ignore
    }
  }, [messages, user?.id])

  const send = useCallback(
    async (text: string) => {
      const content = text.trim()
      if (!content || isStreaming) return

      setError(null)
      const userMsg: ChatMsg = { id: newId(), role: 'user', content, at: Date.now() }
      const botMsg: ChatMsg = { id: newId(), role: 'assistant', content: '', at: Date.now() }
      const outbound = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
      setMessages((prev) => [...prev, userMsg, botMsg])
      setIsStreaming(true)

      const ac = new AbortController()
      abortRef.current = ac

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: outbound, lang }),
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
          setMessages((prev) => prev.filter((m) => m.id !== botMsg.id))
          setError(msg)
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
            setMessages((prev) =>
              prev.map((m) => (m.id === botMsg.id ? { ...m, content: m.content + delta } : m))
            )
          }
        }
        if (!got) {
          setMessages((prev) => prev.filter((m) => m.id !== botMsg.id))
          setError(lang === 'bn' ? 'কোনো উত্তর আসেনি — আবার চেষ্টা করুন।' : 'No reply came through — try again.')
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setMessages((prev) => prev.filter((m) => m.id !== botMsg.id && m.content !== ''))
          setError(lang === 'bn' ? 'সংযোগ সমস্যা — আবার চেষ্টা করুন।' : 'Connection problem — try again.')
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [messages, lang, isStreaming]
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clear = useCallback(() => {
    setMessages([])
    setRedFlag('none')
    setError(null)
    if (user?.id) {
      try {
        localStorage.removeItem(cacheKey(user.id))
      } catch {
        // ignore
      }
      // Fire-and-forget server-side wipe (RLS delete-own policy).
      import('@/lib/supabase/client')
        .then(({ createClient }) => createClient().from('chat_messages').delete().eq('user_id', user.id))
        .catch(() => {})
    }
  }, [user?.id])

  return { messages, send, stop, clear, isStreaming, redFlag, error }
}
