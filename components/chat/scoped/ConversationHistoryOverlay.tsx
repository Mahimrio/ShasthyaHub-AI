'use client'

import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { History, X, Trash2, MessageSquareText, Clock, CloudOff, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AGENT_THEME } from './agentTheme'
import type { ChatAgent, ScopedConversation } from '@/types'

interface ConversationHistoryOverlayProps {
  open: boolean
  onClose: () => void
  agent: ChatAgent
  lang: 'bn' | 'en'
  conversations: ScopedConversation[]
  isLoading: boolean
  /** Conversation the page is about right now. */
  currentContextId: string
  /** Conversation currently shown in the composer. */
  activeContextId: string
  onSelect: (conversation: ScopedConversation) => void
  onDelete: (contextId: string) => void
}

function formatWhen(iso: string, lang: 'bn' | 'en'): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const locale = lang === 'bn' ? 'bn-BD' : 'en-GB'
  const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return lang === 'bn' ? `আজ ${time}` : `Today ${time}`
  if (d.toDateString() === yesterday.toDateString()) return lang === 'bn' ? `গতকাল ${time}` : `Yesterday ${time}`
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' })
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.08 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 420, damping: 32 } },
  exit: { opacity: 0, x: 24, height: 0, marginBottom: 0, transition: { duration: 0.18 } },
}

/** Bottom sheet on phones, centred panel on larger screens. Portaled: glass cards trap fixed children. */
export function ConversationHistoryOverlay({
  open,
  onClose,
  agent,
  lang,
  conversations,
  isLoading,
  currentContextId,
  activeContextId,
  onSelect,
  onDelete,
}: ConversationHistoryOverlayProps) {
  const reduceMotion = useReducedMotion()
  const theme = AGENT_THEME[agent]
  const titleId = useId()
  const isBn = lang === 'bn'
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- portal target only exists after mount
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!mounted) return null

  const kindLabel = (c: ScopedConversation) => {
    if (c.contextId === currentContextId) return isBn ? 'বর্তমান' : 'Current'
    if (c.kind === 'general') return isBn ? 'সাধারণ' : 'General'
    if (c.kind === 'questionnaire') return isBn ? 'প্রশ্নপত্র' : 'Questionnaire'
    return isBn ? 'আগের ফলাফল' : 'Earlier result'
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="history-overlay"
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
        >
          <button
            type="button"
            aria-label={isBn ? 'বন্ধ করুন' : 'Close'}
            onClick={onClose}
            className="absolute inset-0 bg-gray-950/50 backdrop-blur-[6px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reduceMotion ? false : { opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 34, mass: 0.9 }}
            className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl border border-gray-200/70 bg-white shadow-2xl dark:border-gray-700/60 dark:bg-gray-900 sm:max-w-lg sm:rounded-3xl"
          >
            <div className={cn('h-1 w-full', theme.gradient)} />
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-gray-200 dark:bg-gray-700 sm:hidden" aria-hidden="true" />

            <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-3 sm:pt-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm', theme.dot)}>
                  <History className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <h2 id={titleId} className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {isBn ? 'আগের কথোপকথন' : 'Conversation history'}
                  </h2>
                  <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {isBn ? `${theme.nameBn} · ${conversations.length} টি` : `${theme.nameEn} · ${conversations.length} ${conversations.length === 1 ? 'conversation' : 'conversations'}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                autoFocus
                aria-label={isBn ? 'বন্ধ করুন' : 'Close'}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 sm:px-4">
              {isLoading && conversations.length === 0 ? (
                <ul className="space-y-2" aria-busy="true">
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="h-[76px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800/70" />
                  ))}
                </ul>
              ) : conversations.length === 0 ? (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center px-6 py-12 text-center"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                    <MessageSquareText className="h-6 w-6" />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {isBn ? 'এখনও কোনো কথোপকথন নেই' : 'No conversations yet'}
                  </p>
                  <p className="mt-1 max-w-xs text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {isBn
                      ? `${theme.nameBn}-কে কিছু জিজ্ঞাসা করুন — আপনার কথোপকথন এখানে জমা থাকবে।`
                      : `Ask ${theme.nameEn} something — your conversations will be saved here.`}
                  </p>
                </motion.div>
              ) : (
                <motion.ul variants={listVariants} initial={reduceMotion ? false : 'hidden'} animate="show" className="space-y-2">
                  <AnimatePresence initial={false}>
                    {conversations.map((c) => {
                      const active = c.contextId === activeContextId
                      const isCurrent = c.contextId === currentContextId
                      return (
                        <motion.li key={c.contextId} variants={itemVariants} exit="exit" layout className="overflow-hidden">
                          <div
                            className={cn(
                              'group relative flex items-stretch gap-2 rounded-2xl border transition-colors',
                              active
                                ? 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/80'
                                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:bg-gray-800/60'
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => onSelect(c)}
                              className="flex min-w-0 flex-1 items-start gap-3 px-3.5 py-3 text-left"
                            >
                              <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', theme.dot)} aria-hidden="true" />
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-1.5">
                                  <span
                                    className={cn(
                                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                      isCurrent
                                        ? cn(theme.chipActive, 'border')
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                                    )}
                                  >
                                    {kindLabel(c)}
                                  </span>
                                  <span className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                                    {isBn ? c.labelBn || c.labelEn : c.labelEn || c.labelBn}
                                  </span>
                                  {c.localOnly && (
                                    <span title={isBn ? 'শুধু এই ডিভাইসে সংরক্ষিত' : 'Saved on this device only'} className="text-gray-400">
                                      <CloudOff className="h-3 w-3" />
                                    </span>
                                  )}
                                </span>
                                <span className="mt-1 line-clamp-2 block text-[13px] font-medium leading-snug text-gray-900 dark:text-gray-100">
                                  {c.title || (isBn ? 'শিরোনামহীন' : 'Untitled')}
                                </span>
                                {c.preview && (
                                  <span className="mt-0.5 line-clamp-1 block text-xs text-gray-500 dark:text-gray-400">{c.preview}</span>
                                )}
                                <span className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  {formatWhen(c.updatedAt, lang)} · {isBn ? `${c.count} টি বার্তা` : `${c.count} messages`}
                                </span>
                              </span>
                              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500 dark:text-gray-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(c.contextId)}
                              aria-label={isBn ? 'এই কথোপকথন মুছুন' : 'Delete this conversation'}
                              className="flex w-10 shrink-0 items-center justify-center rounded-r-2xl text-gray-300 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:text-gray-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </motion.li>
                      )
                    })}
                  </AnimatePresence>
                </motion.ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
