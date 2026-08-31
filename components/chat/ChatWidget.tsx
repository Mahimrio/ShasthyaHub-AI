'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { MessageCircle, X, Trash2, Send, Square, HeartPulse, WifiOff, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useChat } from '@/hooks/useChat'
import { ChatMessage } from './ChatMessage'
import { SuggestedPrompts } from './SuggestedPrompts'
import { ChatCrisisNote } from './ChatCrisisNote'

function TypingDots() {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500">
        <HeartPulse className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-gray-100 bg-white px-3.5 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-800/80">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400 motion-reduce:animate-none"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

export function ChatWidget() {
  const { lang } = useLanguage()
  const { isOnline } = useNetworkStatus()
  const { messages, send, stop, clear, isStreaming, redFlag, error } = useChat()
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Follow the stream to the bottom.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isStreaming, open])

  const submit = () => {
    if (!input.trim() || isStreaming || !isOnline) return
    send(input)
    setInput('')
  }

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="chat-fab"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            onClick={() => setOpen(true)}
            aria-label={lang === 'bn' ? 'স্বাস্থ্য বন্ধুর সাথে চ্যাট করুন' : 'Chat with Shasthya Bondhu'}
            className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 text-white shadow-lg shadow-sky-500/30 transition-transform hover:-translate-y-1 hover:shadow-xl active:scale-95 md:bottom-6 md:right-6"
          >
            <MessageCircle className="h-6 w-6" strokeWidth={2.2} />
            <span
              className={cn(
                'absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-950',
                isOnline ? 'bg-emerald-400' : 'bg-amber-400'
              )}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed inset-x-3 bottom-3 top-[4.25rem] z-50 flex flex-col overflow-hidden rounded-2xl border border-gray-200/60 bg-gray-50 shadow-2xl dark:border-gray-700/60 dark:bg-gray-950 md:inset-auto md:bottom-6 md:right-6 md:h-[560px] md:w-[380px]"
          >
            {/* Header */}
            <div className="border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="h-0.5 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500" />
              <div className="flex items-center gap-2.5 px-3.5 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 shadow-md shadow-sky-500/20">
                  <HeartPulse className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                    {lang === 'bn' ? 'স্বাস্থ্য বন্ধু' : 'Shasthya Bondhu'}
                  </p>
                  <p className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                    <span className={cn('h-1.5 w-1.5 rounded-full', isOnline ? 'bg-emerald-500' : 'bg-amber-500')} />
                    {isOnline
                      ? lang === 'bn' ? 'অনলাইন · AI সহকারী' : 'Online · AI assistant'
                      : lang === 'bn' ? 'অফলাইন' : 'Offline'}
                  </p>
                </div>
                {messages.length > 0 && (
                  <button
                    onClick={clear}
                    aria-label={lang === 'bn' ? 'চ্যাট মুছুন' : 'Clear chat'}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-rose-500 dark:hover:bg-gray-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3.5">
              {messages.length === 0 ? (
                <div className="space-y-4 pt-2">
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                      {lang === 'bn' ? 'আসসালামু আলাইকুম!' : 'Hello!'}
                    </p>
                    <p className="mx-auto mt-1 max-w-[260px] text-xs leading-relaxed text-gray-400 dark:text-gray-500">
                      {lang === 'bn'
                        ? 'আমি আপনার স্বাস্থ্য সহকারী। স্বাস্থ্য, খাদ্য, ওষুধ বা আপনার রিপোর্ট নিয়ে যেকোনো প্রশ্ন করুন।'
                        : 'I am your health assistant. Ask me anything about health, food, medicines, or your reports.'}
                    </p>
                  </div>
                  <SuggestedPrompts lang={lang} onPick={(t) => send(t)} />
                </div>
              ) : (
                <>
                  {messages.map((m) =>
                    m.role === 'assistant' && m.content === '' && isStreaming ? (
                      <TypingDots key={m.id} />
                    ) : (
                      <ChatMessage key={m.id} msg={m} lang={lang} isOnline={isOnline} />
                    )
                  )}
                  <ChatCrisisNote level={redFlag} lang={lang} />
                </>
              )}
              {error && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                  {error}
                </p>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
              {!isOnline && (
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  <WifiOff className="h-3 w-3" />
                  {lang === 'bn' ? 'চ্যাট অনলাইনে কাজ করে' : 'Chat needs an internet connection'}
                </p>
              )}
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submit()}
                  disabled={!isOnline}
                  placeholder={lang === 'bn' ? 'আপনার প্রশ্ন লিখুন…' : 'Type your question…'}
                  className="h-10 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-[13px] text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500"
                />
                {isStreaming ? (
                  <button
                    onClick={stop}
                    aria-label={lang === 'bn' ? 'থামান' : 'Stop'}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-gray-600 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                  >
                    <Square className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={!input.trim() || !isOnline}
                    aria-label={lang === 'bn' ? 'পাঠান' : 'Send'}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md transition-all hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:shadow-none"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-2 flex items-center justify-center gap-1 text-center text-[10px] text-gray-400 dark:text-gray-600">
                <ShieldAlert className="h-3 w-3 text-amber-500" />
                {lang === 'bn' ? 'এআই সহকারী — চিকিৎসকের বিকল্প নয়' : 'AI assistant — not a substitute for a doctor'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
