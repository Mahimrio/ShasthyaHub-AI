'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Headphones, Loader2, Pause, Play, Sparkles, Square, Volume2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Language } from '@/types'

interface AudioGuideProps {
  audioScriptBn: string
  lang: Language
}

type PlayState = 'idle' | 'playing' | 'paused' | 'ended'

/**
 * Approximate chars spoken per second at rate 0.85 — used to drive the
 * progress bar since the Web Speech API gives no granular char boundary
 * events across all browsers.
 */
const CHARS_PER_SECOND = 13

const SLOT_LABELS_BN = ['সকাল', 'দুপুর', 'সন্ধ্যা', 'রাত']
const SLOT_LABELS_EN = ['Morning', 'Afternoon', 'Evening', 'Night']

/**
 * Pick the best available Bengali voice. Preference order: bn-BD (Bangladesh),
 * bn-IN (India), then any voice whose BCP-47 lang starts with "bn".
 * Returns null when no Bengali voice is installed on this device.
 */
function pickBnVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find((v) => v.lang === 'bn-BD') ??
    voices.find((v) => v.lang === 'bn-IN') ??
    voices.find((v) => v.lang.toLowerCase().startsWith('bn')) ??
    null
  )
}

/**
 * Find which schedule slot the narration is currently in, based on word index
 * matched against slot keywords. Returns -1 if none found.
 */
function detectCurrentSlot(
  text: string,
  spokenChars: number,
  lang: Language
): number {
  const labels = lang === 'bn' ? SLOT_LABELS_BN : SLOT_LABELS_EN
  const positions = labels
    .map((label) => text.indexOf(label))
    .map((pos, idx) => ({ pos, idx }))
    .filter((p) => p.pos >= 0)
    .sort((a, b) => a.pos - b.pos)

  let current = -1
  for (const { pos, idx } of positions) {
    if (pos <= spokenChars) current = idx
  }
  return current
}

// --- SSR-safe feature detection for window.speechSynthesis ------------------

const EMPTY_SUBSCRIBE = () => () => {}
function getSpeechSnapshot(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export default function AudioGuide({ audioScriptBn, lang }: AudioGuideProps) {
  const [playState, setPlayState] = useState<PlayState>('idle')
  const [progress, setProgress] = useState(0)
  const [currentSlot, setCurrentSlot] = useState<number>(-1)
  const [bnVoiceAvailable, setBnVoiceAvailable] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Server TTS fallback (no on-device Bengali voice)
  const [ttsLoading, setTtsLoading] = useState(false)
  const [serverTtsFailed, setServerTtsFailed] = useState(false)
  const [serverDuration, setServerDuration] = useState<number | null>(null)
  const supported = useSyncExternalStore(
    EMPTY_SUBSCRIBE,
    getSpeechSnapshot,
    () => false
  )

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bnVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const startTimeRef = useRef<number>(0)
  const elapsedBeforePauseRef = useRef<number>(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const audioScriptRef = useRef<string | null>(null)

  const labels =
    lang === 'bn'
      ? {
          header: 'ওষুধের নির্দেশনা শুনুন',
          subtitle: 'বাংলা ভাষায় আপনার ওষুধ গ্রহণের সময়সূচি',
          play: 'শুনুন',
          pause: 'থামুন',
          stop: 'বন্ধ',
          unsupported:
            'আপনার ব্রাউজার অডিও সমর্থন করে না। সেরা ফলাফলের জন্য Android-এ Chrome ব্যবহার করুন।',
          nowReading: 'এখন পড়া হচ্ছে',
          ended: 'শেষ হয়েছে',
          errorTitle: 'প্লেব্যাক সমস্যা',
          errorMessage: 'অডিও চালানো যায়নি। আবার চেষ্টা করুন বা অন্য ব্রাউজার ব্যবহার করুন।',
          noVoiceTitle: 'বাংলা অডিও উপলব্ধ নয়',
          noVoiceMessage:
            'এই ডিভাইসে বাংলা ভয়েস নেই এবং অনলাইন অডিও তৈরি করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন অথবা ডিভাইসে বাংলা ভয়েস প্যাক যোগ করুন।',
          preparing: 'অডিও তৈরি হচ্ছে...',
          aiVoice: 'AI ভয়েস — অনলাইনে তৈরি',
        }
      : {
          header: 'Listen to Your Schedule',
          subtitle: 'Bengali audio narration of your medication plan',
          play: 'Play',
          pause: 'Pause',
          stop: 'Stop',
          unsupported:
            "Your browser doesn't support audio. Use Chrome on Android for best results.",
          nowReading: 'Now reading',
          ended: 'Finished',
          errorTitle: 'Playback Error',
          errorMessage: 'Could not play the audio. Please try again or use a different browser.',
          noVoiceTitle: 'Bengali Audio Unavailable',
          noVoiceMessage:
            'No Bengali voice on this device and online audio could not be generated. Check your connection, or add a Bengali voice pack in your device settings.',
          preparing: 'Preparing audio...',
          aiVoice: 'AI voice — generated online',
        }
  const errorMessage = labels.errorMessage

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (keepAliveRef.current) clearInterval(keepAliveRef.current)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      audioRef.current?.pause()
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    }
  }, [])

  // Load Bengali voices via getVoices() + voiceschanged.
  useEffect(() => {
    if (!supported) return
    const synth = window.speechSynthesis
    const loadVoices = () => {
      const voices = synth.getVoices()
      if (voices.length === 0) return
      const bn = pickBnVoice(voices)
      bnVoiceRef.current = bn
      setBnVoiceAvailable(bn !== null)
    }
    loadVoices()
    synth.addEventListener('voiceschanged', loadVoices)
    return () => synth.removeEventListener('voiceschanged', loadVoices)
  }, [supported])

  const totalChars = audioScriptBn.length
  const estimatedDurationSec = Math.max(totalChars / CHARS_PER_SECOND, 1)
  const totalDurationSec = serverDuration ?? estimatedDurationSec
  const useServerTts = !bnVoiceAvailable

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const stopKeepAlive = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current)
      keepAliveRef.current = null
    }
  }, [])

  const startKeepAlive = useCallback(() => {
    stopKeepAlive()
    keepAliveRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.resume()
      }
    }, 10000)
  }, [stopKeepAlive])

  const startProgressTimer = useCallback(
    (resumeFromMs: number) => {
      clearTimer()
      startTimeRef.current = Date.now() - resumeFromMs
      intervalRef.current = setInterval(() => {
        const elapsedMs = Date.now() - startTimeRef.current
        const pct = Math.min((elapsedMs / 1000 / totalDurationSec) * 100, 100)
        setProgress(pct)

        const spokenChars = Math.floor((pct / 100) * totalChars)
        setCurrentSlot(detectCurrentSlot(audioScriptBn, spokenChars, lang))

        if (pct >= 100) {
          clearTimer()
          setPlayState('ended')
          setCurrentSlot(-1)
        }
      }, 200)
    },
    [clearTimer, totalDurationSec, totalChars, audioScriptBn, lang]
  )

  // --- Server TTS playback (no on-device Bengali voice) ---
  const wireAudioElement = useCallback(
    (audio: HTMLAudioElement) => {
      audio.ontimeupdate = () => {
        if (!audio.duration || Number.isNaN(audio.duration)) return
        const pct = Math.min((audio.currentTime / audio.duration) * 100, 100)
        setProgress(pct)
        const spokenChars = Math.floor((pct / 100) * totalChars)
        setCurrentSlot(detectCurrentSlot(audioScriptBn, spokenChars, lang))
      }
      audio.onloadedmetadata = () => {
        if (audio.duration && Number.isFinite(audio.duration)) {
          setServerDuration(audio.duration)
        }
      }
      audio.onended = () => {
        setPlayState('ended')
        setProgress(100)
        setCurrentSlot(-1)
      }
      audio.onerror = () => {
        setPlayState('idle')
        setProgress(0)
        setCurrentSlot(-1)
        setError(errorMessage)
      }
    },
    [audioScriptBn, totalChars, lang, errorMessage]
  )

  const playServerTts = useCallback(async () => {
    setError(null)

    // Resume path.
    if (playState === 'paused' && audioRef.current && audioScriptRef.current === audioScriptBn) {
      await audioRef.current.play().catch(() => setError(errorMessage))
      setPlayState('playing')
      return
    }

    // Cached audio for this exact script.
    if (audioRef.current && audioScriptRef.current === audioScriptBn) {
      audioRef.current.currentTime = 0
      setProgress(0)
      await audioRef.current.play().catch(() => setError(errorMessage))
      setPlayState('playing')
      return
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setServerTtsFailed(true)
      return
    }

    setTtsLoading(true)
    try {
      const res = await fetch('/api/scriptguard/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: audioScriptBn.slice(0, 1500) }),
      })
      const json = await res.json()
      if (!res.ok || !json?.data?.wavBase64) throw new Error(json?.error ?? 'tts failed')

      const bytes = Uint8Array.from(atob(json.data.wavBase64), (c) => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: 'audio/wav' })
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
      const url = URL.createObjectURL(blob)
      audioUrlRef.current = url

      const audio = new Audio(url)
      wireAudioElement(audio)
      audioRef.current = audio
      audioScriptRef.current = audioScriptBn
      setServerTtsFailed(false)
      setProgress(0)
      await audio.play()
      setPlayState('playing')
    } catch {
      setServerTtsFailed(true)
    } finally {
      setTtsLoading(false)
    }
  }, [audioScriptBn, playState, wireAudioElement, errorMessage])

  // --- handlePlay ---
  const handlePlay = useCallback(() => {
    if (!supported) return
    if (!audioScriptBn) return

    if (useServerTts) {
      void playServerTts()
      return
    }

    setError(null)
    if (playState === 'paused') {
      window.speechSynthesis.resume()
      const resumeFromMs = (progress / 100) * totalDurationSec * 1000
      startProgressTimer(resumeFromMs)
      startKeepAlive()
      setPlayState('playing')
      return
    }

    // Fresh start.
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(audioScriptBn)
    utterance.lang = 'bn-BD'
    utterance.rate = 0.85
    utterance.pitch = 1.0
    if (bnVoiceRef.current) utterance.voice = bnVoiceRef.current

    utterance.onend = () => {
      clearTimer()
      stopKeepAlive()
      setPlayState('ended')
      setProgress(100)
      setCurrentSlot(-1)
      elapsedBeforePauseRef.current = 0
    }
    utterance.onerror = () => {
      clearTimer()
      stopKeepAlive()
      setPlayState('idle')
      setProgress(0)
      setCurrentSlot(-1)
      elapsedBeforePauseRef.current = 0
      setError(errorMessage)
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    elapsedBeforePauseRef.current = 0
    setProgress(0)
    setPlayState('playing')
    startProgressTimer(0)
    startKeepAlive()
  }, [
    supported,
    audioScriptBn,
    playState,
    progress,
    totalDurationSec,
    startProgressTimer,
    startKeepAlive,
    stopKeepAlive,
    clearTimer,
    errorMessage,
    useServerTts,
    playServerTts,
  ])

  const handlePause = useCallback(() => {
    if (playState !== 'playing') return

    if (useServerTts) {
      audioRef.current?.pause()
      setPlayState('paused')
      return
    }

    if (!supported) return
    window.speechSynthesis.pause()
    clearTimer()
    stopKeepAlive()
    elapsedBeforePauseRef.current = Date.now() - startTimeRef.current
    setPlayState('paused')
  }, [supported, playState, clearTimer, stopKeepAlive, useServerTts])

  const handleStop = useCallback(() => {
    if (useServerTts) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setError(null)
      setPlayState('idle')
      setProgress(0)
      setCurrentSlot(-1)
      return
    }

    if (!supported) return
    window.speechSynthesis.cancel()
    clearTimer()
    stopKeepAlive()
    setError(null)
    setPlayState('idle')
    setProgress(0)
    setCurrentSlot(-1)
    elapsedBeforePauseRef.current = 0
  }, [supported, clearTimer, stopKeepAlive, useServerTts])

  const slotLabels = lang === 'bn' ? SLOT_LABELS_BN : SLOT_LABELS_EN

  if (!supported) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start gap-3">
          <Headphones className="mt-0.5 h-5 w-5 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {labels.unsupported}
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">{labels.header}</h3>
            <p className="text-xs text-white/80">{labels.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {/* Playback error */}
        {error && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle>{labels.errorTitle}</AlertTitle>
            <AlertDescription>{labels.errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* No Bengali voice AND the online fallback failed */}
        {!error && supported && useServerTts && serverTtsFailed && (
          <Alert className="border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200">
            <AlertTriangle className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <AlertTitle>{labels.noVoiceTitle}</AlertTitle>
            <AlertDescription>{labels.noVoiceMessage}</AlertDescription>
          </Alert>
        )}

        {/* Online AI voice notice */}
        {!error && supported && useServerTts && !serverTtsFailed && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
            <Sparkles className="h-3 w-3" />
            {labels.aiVoice}
          </div>
        )}

        {/* Current slot indicator */}
        <div className="min-h-[28px]">
          {currentSlot >= 0 && playState === 'playing' ? (
            <motion.div
              key={currentSlot}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 dark:bg-emerald-900/30"
            >
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <Volume2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </motion.span>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {labels.nowReading}:{' '}
                <span className="font-bengali">{slotLabels[currentSlot]}</span>
              </span>
            </motion.div>
          ) : playState === 'ended' ? (
            <span className="text-xs text-gray-400">{labels.ended}</span>
          ) : null}
        </div>

        {/* Progress bar */}
        <div>
          <Progress value={progress} className="h-2" />
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
            <span>{Math.floor((progress / 100) * totalDurationSec)}s</span>
            <span>{Math.round(totalDurationSec)}s</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex-1 min-w-[120px]" tabIndex={0}>
                  <Button
                    onClick={handlePlay}
                    disabled={playState === 'playing' || ttsLoading || (useServerTts && serverTtsFailed)}
                    className={cn(
                      'flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90',
                      'min-w-[120px] w-full'
                    )}
                  >
                    {ttsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {labels.preparing}
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        {playState === 'paused' ? (lang === 'bn' ? 'চালিয়ে যান' : 'Resume') : labels.play}
                      </>
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {useServerTts && serverTtsFailed && (
                <TooltipContent>
                  {lang === 'bn'
                    ? 'বাংলা অডিও অফলাইনে উপলব্ধ নেই'
                    : 'Audio unavailable offline'}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <Button
            onClick={handlePause}
            disabled={playState !== 'playing'}
            variant="outline"
            className="flex-1 rounded-xl min-w-[100px]"
          >
            <Pause className="mr-2 h-4 w-4" />
            {labels.pause}
          </Button>
          <Button
            onClick={handleStop}
            disabled={playState === 'idle' || playState === 'ended'}
            variant="outline"
            className="flex-1 rounded-xl min-w-[100px]"
          >
            <Square className="mr-2 h-4 w-4" />
            {labels.stop}
          </Button>
        </div>

        {/* Slot preview row */}
        <div className="flex items-center justify-between gap-1 rounded-xl bg-gray-50 p-2 dark:bg-gray-900/40">
          {slotLabels.map((label, i) => (
            <div
              key={label}
              className={cn(
                'flex-1 rounded-lg px-2 py-1.5 text-center text-xs font-medium transition-all',
                currentSlot === i && playState === 'playing'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                  : 'text-gray-400 dark:text-gray-500'
              )}
            >
              <span className="font-bengali">{label}</span>
            </div>
          ))}
        </div>

        {/* Bengali script preview (truncated) */}
        <details className="group">
          <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-500 dark:text-gray-500">
            {lang === 'bn' ? 'সম্পূর্ণ স্ক্রিপ্ট দেখুন' : 'View full script'}
          </summary>
          <p className="mt-2 max-h-32 overflow-y-auto rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-600 dark:bg-gray-900/40 dark:text-gray-300 font-bengali">
            {audioScriptBn}
          </p>
        </details>
      </div>
    </motion.div>
  )
}
