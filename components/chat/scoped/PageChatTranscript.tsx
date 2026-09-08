'use client'

import { useEffect, useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FormattedText, SpeakButton } from '@/components/chat/ChatMessage'
import { ChatCrisisNote } from '@/components/chat/ChatCrisisNote'
import { AGENT_THEME } from './agentTheme'
import type { ChatMsg, RedFlagLevel } from '@/hooks/useChat'
import type { ChatAgent } from '@/types'

interface PageChatTranscriptProps {
  agent: ChatAgent
  lang: 'bn' | 'en'
  messages: ChatMsg[]
  isStreaming: boolean
  isOnline: boolean
  redFlag: RedFlagLevel
  error: string | null
  canRetry: boolean
  onRetry: () => void
}

/** Document-style transcript: compact user turns, full-width assistant prose. */
export function PageChatTranscript({
  agent,
  lang,
  messages,
  isStreaming,
  isOnline,
  redFlag,
  error,
  canRetry,
  onRetry,
}: PageChatTranscriptProps) {
  const theme = AGENT_THEME[agent]
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isStreaming])

  if (messages.length === 0 && !error) return null

  const lastId = messages[messages.length - 1]?.id

  return (
    <div ref={scrollRef} className="max-h-105 space-y-4 overflow-y-auto pr-1" aria-live="polite">
      {messages.map((msg) => {
        if (msg.role === 'user') {
          return (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[80%] select-text whitespace-pre-wrap rounded-2xl bg-gray-100 px-3.5 py-2 text-[13.5px] leading-relaxed text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                {msg.content}
              </div>
            </div>
          )
        }

        const streamingThis = isStreaming && msg.id === lastId
        return (
          <div key={msg.id} className="flex gap-3">
            <span className={cn('mt-2 h-2 w-2 shrink-0 rounded-full', theme.dot)} aria-hidden="true" />
            <div className="min-w-0 flex-1 select-text text-[14px] leading-relaxed text-gray-700 dark:text-gray-200">
              {msg.content === '' && streamingThis ? (
                <span className="inline-flex items-center gap-1 py-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={cn('h-1.5 w-1.5 animate-bounce rounded-full motion-reduce:animate-none', theme.dot)}
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
              ) : (
                <>
                  <FormattedText text={msg.content} />
                  {streamingThis && (
                    <span className={cn('ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-text-bottom', theme.text)} aria-hidden="true" />
                  )}
                  {!streamingThis && msg.content.length > 0 && isOnline && <SpeakButton text={msg.content} lang={lang} />}
                </>
              )}
            </div>
          </div>
        )
      })}

      {redFlag !== 'none' && <ChatCrisisNote level={redFlag} lang={lang} />}

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <span>{error}</span>
          {canRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 font-semibold text-rose-700 shadow-sm transition-colors hover:bg-rose-100 dark:bg-gray-900 dark:text-rose-300 dark:hover:bg-gray-800"
            >
              <RotateCcw className="h-3 w-3" />
              {lang === 'bn' ? 'আবার চেষ্টা' : 'Retry'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
