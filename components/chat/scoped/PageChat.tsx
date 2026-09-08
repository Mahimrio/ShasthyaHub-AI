'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Sparkles, Trash2, WifiOff, ShieldAlert, History, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRegisterPageChat } from '@/contexts/PageChatPresenceContext'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useScopedChat } from '@/hooks/useScopedChat'
import { useScopedConversations } from '@/hooks/useScopedConversations'
import { ChatComposer } from './ChatComposer'
import { PageChatTranscript } from './PageChatTranscript'
import { StarterPrompts } from './StarterPrompts'
import { ConversationHistoryOverlay } from './ConversationHistoryOverlay'
import { AGENT_THEME } from './agentTheme'
import { getScopedPrompts, type ScopedChatMode } from './scopedPrompts'
import type { ChatAgent, ScopedChatContext, ScopedChatOptions, ScopedConversation } from '@/types'

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

const DEFAULT_OPTIONS: ScopedChatOptions = { simple: false, doctorQuestions: false, includeHistory: true }
// Reopened conversations carry no page context; the server rebuilds it from the analysis row.
const noContext = () => null

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
  const reduceMotion = useReducedMotion()
  const theme = AGENT_THEME[agent]
  const isBn = lang === 'bn'

  const [options, setOptions] = useState<ScopedChatOptions>(DEFAULT_OPTIONS)
  const [viewing, setViewing] = useState<ScopedConversation | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const { conversations, isLoading: historyLoading, refetch, remove, invalidate } = useScopedConversations(agent, true)

  const activeContextId = viewing?.contextId ?? contextId

  const openHistory = () => {
    setHistoryOpen(true)
    void refetch()
  }
  const selectConversation = (c: ScopedConversation) => {
    setHistoryOpen(false)
    setViewing(c.contextId === contextId ? null : c)
  }
  const deleteConversation = async (id: string) => {
    if (viewing?.contextId === id) setViewing(null)
    await remove(id)
  }

  return (
    <motion.section
      aria-label={isBn ? `${theme.nameBn} সহকারী` : `${theme.nameEn} assistant`}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('glass-card rounded-3xl p-4 sm:p-5', className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeContextId}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
        >
          <ConversationPane
            agent={agent}
            contextId={activeContextId}
            getContext={viewing ? noContext : getContext}
            mode={viewing ? (viewing.kind === 'analysis' ? 'result' : 'idle') : mode}
            label={viewing ? (isBn ? viewing.labelBn || viewing.labelEn : viewing.labelEn || viewing.labelBn) : contextLabel}
            viewing={viewing}
            onBackToCurrent={() => setViewing(null)}
            options={options}
            onToggleOption={(key) => setOptions((o) => ({ ...o, [key]: !o[key] }))}
            onAttachImage={onAttachImage}
            onOpenHistory={openHistory}
            historyCount={conversations.length}
            onConversationChanged={invalidate}
          />
        </motion.div>
      </AnimatePresence>

      <ConversationHistoryOverlay
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        agent={agent}
        lang={lang}
        conversations={conversations}
        isLoading={historyLoading}
        currentContextId={contextId}
        activeContextId={activeContextId}
        onSelect={selectConversation}
        onDelete={(id) => void deleteConversation(id)}
      />
    </motion.section>
  )
}

interface ConversationPaneProps {
  agent: ChatAgent
  contextId: string
  getContext: () => ScopedChatContext | null
  mode: ScopedChatMode
  label?: string
  viewing: ScopedConversation | null
  onBackToCurrent: () => void
  options: ScopedChatOptions
  onToggleOption: (key: keyof ScopedChatOptions) => void
  onAttachImage?: (file: File) => void
  onOpenHistory: () => void
  historyCount: number
  /** Fires after a reply completes, on hydration and on clear so the history list stays fresh. */
  onConversationChanged: () => void
}

/** One conversation: header, transcript, starters, composer. Mounted per contextId. */
function ConversationPane({
  agent,
  contextId,
  getContext,
  mode,
  label,
  viewing,
  onBackToCurrent,
  options,
  onToggleOption,
  onAttachImage,
  onOpenHistory,
  historyCount,
  onConversationChanged,
}: ConversationPaneProps) {
  const { lang } = useLanguage()
  const { isOnline } = useNetworkStatus()
  const reduceMotion = useReducedMotion()
  const theme = AGENT_THEME[agent]
  const isBn = lang === 'bn'
  const [input, setInput] = useState('')

  const { messages, send, retry, stop, clear, isStreaming, redFlag, error, canRetry } = useScopedChat({
    agent,
    contextId,
    getContext,
    options,
    label,
  })

  const name = isBn ? theme.nameBn : theme.nameEn
  const placeholder =
    mode === 'result'
      ? isBn ? theme.placeholderResultBn : theme.placeholderResultEn
      : isBn ? theme.placeholderIdleBn : theme.placeholderIdleEn
  const subtitle = label ?? (mode === 'result' ? (isBn ? 'এই ফলাফল নিয়ে' : 'About this result') : isBn ? 'সাধারণ প্রশ্ন' : 'General questions')

  const submit = () => {
    if (!input.trim() || isStreaming || !isOnline) return
    void send(input)
    setInput('')
  }

  const handleClear = useCallback(() => {
    clear()
    onConversationChanged()
  }, [clear, onConversationChanged])

  const hasMessages = messages.length > 0
  useEffect(() => {
    if (hasMessages && !isStreaming) onConversationChanged()
  }, [hasMessages, isStreaming, onConversationChanged])

  return (
    <>
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
            onClick={handleClear}
            aria-label={isBn ? 'কথোপকথন মুছুন' : 'Clear conversation'}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-rose-500 dark:hover:bg-gray-800"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>

      <AnimatePresence initial={false}>
        {viewing && (
          <motion.div
            key="viewing-banner"
            initial={reduceMotion ? false : { opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className={cn('flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-xs', theme.chipActive)}>
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <History className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {isBn ? 'আগের কথোপকথন দেখছেন' : 'Viewing an earlier conversation'}
                  {' · '}
                  {new Date(viewing.updatedAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </span>
              <button
                type="button"
                onClick={onBackToCurrent}
                className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold shadow-sm transition-transform hover:-translate-y-0.5 dark:bg-gray-900/70"
              >
                <ArrowLeft className="h-3 w-3" />
                {isBn ? 'বর্তমানে ফিরুন' : 'Back to current'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <StarterPrompts prompts={getScopedPrompts(agent, mode, lang)} lang={lang} disabled={!isOnline} onPick={(p) => void send(p)} />
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
          onToggleOption={onToggleOption}
          onAttachImage={onAttachImage}
          onOpenHistory={onOpenHistory}
          historyCount={historyCount}
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
    </>
  )
}
