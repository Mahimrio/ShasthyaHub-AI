'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Sparkles, Trash2, WifiOff, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRegisterPageChat } from '@/contexts/PageChatPresenceContext'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useScopedChat } from '@/hooks/useScopedChat'
import { ChatComposer } from './ChatComposer'
import { PageChatTranscript } from './PageChatTranscript'
import { AGENT_THEME } from './agentTheme'
import { getScopedPrompts, type ScopedChatMode } from './scopedPrompts'
import type { ChatAgent, ScopedChatContext, ScopedChatOptions } from '@/types'

export interface PageChatProps {
  agent: ChatAgent
  /** Analysis id when a result is on screen, otherwise 'general' (or another stable idle key). */
  contextId: string
  /** Read at send time; return null while no analysis exists. */
  getContext: () => ScopedChatContext | null
  mode: ScopedChatMode
  /** Short description of what the chat is about, e.g. "6 medicines · 1 interaction". */
  contextLabel?: string
  /** When provided, shows the paperclip and re-runs the page's analysis with the chosen photo. */
  onAttachImage?: (file: File) => void
  className?: string
}

const DEFAULT_OPTIONS: ScopedChatOptions = { simple: false, doctorQuestions: false, includeHistory: false }

/**
 * In-page assistant limited to one agent and the analysis on screen.
 * Remounts (fresh conversation state) whenever agent or contextId changes.
 */
export function PageChat(props: PageChatProps) {
  return <PageChatInner key={`${props.agent}:${props.contextId}`} {...props} />
}

function PageChatInner({ agent, contextId, getContext, mode, contextLabel, onAttachImage, className }: PageChatProps) {
  useRegisterPageChat()
  const { lang } = useLanguage()
  const { isOnline } = useNetworkStatus()
  const reduceMotion = useReducedMotion()
  const theme = AGENT_THEME[agent]

  const [options, setOptions] = useState<ScopedChatOptions>(DEFAULT_OPTIONS)
  const [input, setInput] = useState('')
  const { messages, send, retry, stop, clear, isStreaming, redFlag, error, canRetry } = useScopedChat({
    agent,
    contextId,
    getContext,
    options,
  })

  const isBn = lang === 'bn'
  const name = isBn ? theme.nameBn : theme.nameEn
  const placeholder =
    mode === 'result'
      ? isBn ? theme.placeholderResultBn : theme.placeholderResultEn
      : isBn ? theme.placeholderIdleBn : theme.placeholderIdleEn
  const subtitle = contextLabel ?? (mode === 'result' ? (isBn ? 'এই ফলাফল নিয়ে' : 'About this result') : isBn ? 'সাধারণ প্রশ্ন' : 'General questions')

  const submit = () => {
    if (!input.trim() || isStreaming || !isOnline) return
    void send(input)
    setInput('')
  }

  return (
    <motion.section
      aria-label={isBn ? `${name} সহকারী` : `${theme.nameEn} assistant`}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('glass-card rounded-3xl p-4 sm:p-5', className)}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-sm', theme.dot)}>
            <Sparkles className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {isBn ? `${name}-কে জিজ্ঞাসা করুন` : `Ask ${name}`}
            </h3>
            <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clear}
            aria-label={isBn ? 'কথোপকথন মুছুন' : 'Clear conversation'}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-rose-500 dark:hover:bg-gray-800"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>

      <div className="mt-4 space-y-4">
        <PageChatTranscript
          agent={agent}
          lang={lang}
          messages={messages}
          isStreaming={isStreaming}
          isOnline={isOnline}
          redFlag={redFlag}
          error={error}
          canRetry={canRetry}
          onRetry={retry}
        />

        {messages.length === 0 && !error && (
          <div className="flex flex-wrap gap-2">
            {getScopedPrompts(agent, mode, lang).map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={!isOnline}
                onClick={() => void send(prompt)}
                className="rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:bg-white hover:shadow-sm disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <ChatComposer
          agent={agent}
          lang={lang}
          value={input}
          onChange={setInput}
          onSend={submit}
          onStop={stop}
          isStreaming={isStreaming}
          disabled={!isOnline}
          placeholder={placeholder}
          options={options}
          onToggleOption={(key) => setOptions((o) => ({ ...o, [key]: !o[key] }))}
          onAttachImage={onAttachImage}
        />

        {!isOnline && (
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <WifiOff className="h-3.5 w-3.5" />
            {isBn ? 'অফলাইনে চ্যাট পাওয়া যাবে না' : 'Chat needs an internet connection'}
          </p>
        )}

        <p className="flex items-center justify-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
          <ShieldAlert className="h-3 w-3" />
          {isBn ? 'AI সহকারী — ডাক্তারের বিকল্প নয়' : 'AI assistant — not a substitute for a doctor'}
        </p>
      </div>
    </motion.section>
  )
}
