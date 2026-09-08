'use client'

import { useEffect, useRef, type KeyboardEvent } from 'react'
import { ArrowUp, Square, Paperclip, Feather, Stethoscope, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AGENT_THEME } from './agentTheme'
import type { ChatAgent, ScopedChatOptions } from '@/types'

const CHIPS: { key: Exclude<keyof ScopedChatOptions, 'includeHistory'>; icon: typeof Feather; en: string; bn: string }[] = [
  { key: 'simple', icon: Feather, en: 'Simple words', bn: 'সহজ ভাষা' },
  { key: 'doctorQuestions', icon: Stethoscope, en: 'Doctor questions', bn: 'ডাক্তারকে প্রশ্ন' },
]

interface ChatComposerProps {
  agent: ChatAgent
  lang: 'bn' | 'en'
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
  placeholder: string
  options: ScopedChatOptions
  onToggleOption: (key: keyof ScopedChatOptions) => void
  onAttachImage?: (file: File) => void
  onOpenHistory: () => void
  historyCount?: number
}

/** DeepSeek-style block: growing textbox on top, mode chips + attach/send below. */
export function ChatComposer({
  agent,
  lang,
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  disabled = false,
  placeholder,
  options,
  onToggleOption,
  onAttachImage,
  onOpenHistory,
  historyCount = 0,
}: ChatComposerProps) {
  const theme = AGENT_THEME[agent]
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const canSend = value.trim().length > 0 && !disabled && !isStreaming

  // Grow with content up to ~6 lines, then scroll.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' && (!e.shiftKey || e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      if (canSend) onSend()
    }
  }

  return (
    <div
      className={cn(
        'rounded-3xl border border-gray-200/80 bg-gray-50 p-3 shadow-sm transition-all focus-within:ring-4 dark:border-gray-700/60 dark:bg-gray-800/70',
        theme.ring,
        disabled && 'opacity-70'
      )}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={placeholder}
        className="block max-h-40 w-full resize-none bg-transparent px-1.5 pt-1 text-[15px] leading-6 text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed dark:text-gray-100 dark:placeholder:text-gray-500"
      />

      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={lang === 'bn' ? 'উত্তরের ধরন' : 'Answer style'}>
          {CHIPS.map(({ key, icon: Icon, en, bn }) => {
            const active = options[key]
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => onToggleOption(key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors motion-reduce:transition-none',
                  active
                    ? theme.chipActive
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100 dark:border-gray-600/60 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {lang === 'bn' ? bn : en}
              </button>
            )
          })}

          <button
            type="button"
            onClick={onOpenHistory}
            aria-haspopup="dialog"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 motion-reduce:transition-none dark:border-gray-600/60 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <History className="h-3.5 w-3.5" />
            {lang === 'bn' ? 'ইতিহাস' : 'History'}
            {historyCount > 0 && (
              <span className={cn('ml-0.5 rounded-full px-1.5 py-px text-[10px] font-semibold leading-4 text-white', theme.gradient)}>
                {historyCount > 99 ? '99+' : historyCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {onAttachImage && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onAttachImage(file)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                disabled={disabled || isStreaming}
                onClick={() => fileRef.current?.click()}
                aria-label={lang === 'bn' ? 'নতুন ছবি দিয়ে আবার বিশ্লেষণ করুন' : 'Attach a new photo to analyse'}
                title={lang === 'bn' ? 'নতুন ছবি' : 'New photo'}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200/70 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              >
                <Paperclip className="h-[18px] w-[18px]" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={isStreaming ? onStop : onSend}
            disabled={!isStreaming && !canSend}
            aria-label={
              isStreaming
                ? lang === 'bn' ? 'উত্তর থামান' : 'Stop reply'
                : lang === 'bn' ? 'পাঠান' : 'Send'
            }
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full transition-all motion-reduce:transition-none',
              isStreaming
                ? 'bg-gray-800 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white'
                : canSend
                  ? cn(theme.gradient, 'text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg active:scale-95')
                  : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
            )}
          >
            {isStreaming ? <Square className="h-3.5 w-3.5 fill-current" /> : <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </div>
  )
}
