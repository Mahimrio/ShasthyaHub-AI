'use client'

import { useRef, useState } from 'react'
import { HeartPulse, Volume2, Square, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMsg } from '@/hooks/useChat'

/** Minimal formatter: **bold**, "- " bullets, newlines. No markdown dependency. */
function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        const isBullet = line.trimStart().startsWith('- ')
        const clean = isBullet ? line.trimStart().slice(2) : line
        const parts = clean.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )
        return isBullet ? (
          <span key={i} className="flex gap-1.5">
            <span className="shrink-0">•</span>
            <span>{parts}</span>
          </span>
        ) : (
          <span key={i} className={cn('block', line === '' && 'h-2')}>{parts}</span>
        )
      })}
    </>
  )
}

/** Speaker button backed by the existing Bengali TTS route. */
function SpeakButton({ text, lang }: { text: string; lang: 'bn' | 'en' }) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stop = () => {
    audioRef.current?.pause()
    audioRef.current = null
    setState('idle')
  }

  const play = async () => {
    if (state === 'playing') return stop()
    if (state === 'loading') return
    setState('loading')
    try {
      // Send speakable text — markdown markers would be read aloud otherwise.
      const speakable = text.replace(/\*\*/g, '').replace(/^\s*-\s+/gm, '')
      const res = await fetch('/api/scriptguard/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: speakable.slice(0, 1600) }),
      })
      if (!res.ok) throw new Error(`tts ${res.status}`)
      const json = (await res.json()) as { success: boolean; data?: { wavBase64: string } }
      if (!json.success || !json.data) throw new Error('tts payload')
      const bytes = Uint8Array.from(atob(json.data.wavBase64), (c) => c.charCodeAt(0))
      const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }))
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        URL.revokeObjectURL(url)
        stop()
      }
      await audio.play()
      setState('playing')
    } catch {
      setState('idle')
    }
  }

  return (
    <button
      onClick={play}
      aria-label={lang === 'bn' ? 'উত্তর শুনুন' : 'Listen to reply'}
      className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-gray-400 transition-colors hover:text-sky-600 dark:text-gray-500 dark:hover:text-sky-400"
    >
      {state === 'loading' ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : state === 'playing' ? (
        <Square className="h-3 w-3" />
      ) : (
        <Volume2 className="h-3 w-3" />
      )}
      {state === 'playing'
        ? lang === 'bn' ? 'থামান' : 'Stop'
        : lang === 'bn' ? 'শুনুন' : 'Listen'}
    </button>
  )
}

export function ChatMessage({ msg, lang, isOnline }: { msg: ChatMsg; lang: 'bn' | 'en'; isOnline: boolean }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] select-text rounded-2xl rounded-br-md bg-gradient-to-r from-sky-500 to-cyan-500 px-3.5 py-2.5 text-[13px] leading-relaxed text-white shadow-sm">
          {msg.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500">
        <HeartPulse className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
      </span>
      <div className="max-w-[85%]">
        <div className="select-text rounded-2xl rounded-tl-md border border-gray-100 bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-200">
          <FormattedText text={msg.content} />
        </div>
        {msg.content.length > 0 && isOnline && <SpeakButton text={msg.content} lang={lang} />}
      </div>
    </div>
  )
}
