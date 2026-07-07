'use client'

import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useNetworkStatus } from './useNetworkStatus'
import { extractPrescriptionTextOffline, checkOcrAvailability } from '@/lib/ai/tesseract-scriptguard'
import { parseOcrToMeds } from '@/lib/services/parse-ocr-to-meds'
import { enqueueAnalysis } from '@/lib/offline-queue'
import type { ApiError, ApiSuccess, ScriptGuardResult, ExtractedMedication, DrugInteraction } from '@/types'

export type OfflineFallbackState = 'idle' | 'missing' | 'unsupported' | 'ready'

interface State {
  result: ScriptGuardResult | null
  isLoading: boolean
  isError: boolean
  error: string | null
  mode: 'online' | 'offline' | null
  offlineStatus: OfflineFallbackState
}

type Action =
  | { type: 'START_LOADING' }
  | { type: 'SET_RESULT'; result: ScriptGuardResult }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SET_MODE'; mode: 'online' | 'offline' | null }
  | { type: 'SET_OFFLINE_STATUS'; status: OfflineFallbackState }
  | { type: 'RESET' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_LOADING':
      return { ...state, isLoading: true, isError: false, error: null, result: null }
    case 'SET_RESULT':
      return { ...state, result: action.result, isLoading: false }
    case 'SET_ERROR':
      return { ...state, error: action.error, isError: true, isLoading: false }
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    case 'SET_OFFLINE_STATUS':
      return { ...state, offlineStatus: action.status }
    case 'RESET':
      return { result: null, isLoading: false, isError: false, error: null, mode: null, offlineStatus: 'idle' }
  }
}

const initialState: State = {
  result: null,
  isLoading: false,
  isError: false,
  error: null,
  mode: null,
  offlineStatus: 'idle',
}

const TIMEOUT_MS = 60_000

export function useScriptGuardAnalysis() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isOnlineRef = useRef(true)
  const statusRef = useRef<OfflineFallbackState>('idle')
  const { isOnline } = useNetworkStatus()

  // Keep refs in sync with state via effects (not during render) to avoid stale closures
  useEffect(() => { isOnlineRef.current = isOnline }, [isOnline])
  useEffect(() => { statusRef.current = state.offlineStatus }, [state.offlineStatus])

  useEffect(() => {
    if (isOnline) {
      dispatch({ type: 'SET_OFFLINE_STATUS', status: 'idle' })
      return
    }
    let cancelled = false
    checkOcrAvailability().then((s) => {
      if (cancelled) return
      if (s === 'ready') dispatch({ type: 'SET_OFFLINE_STATUS', status: 'ready' })
      else if (s === 'missing') dispatch({ type: 'SET_OFFLINE_STATUS', status: 'missing' })
      else if (s === 'unsupported') dispatch({ type: 'SET_OFFLINE_STATUS', status: 'unsupported' })
    })
    return () => { cancelled = true }
  }, [isOnline])

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    clearTimer()
    dispatch({ type: 'RESET' })
  }, [clearTimer])

  const runOfflineAnalysis = useCallback(async (file: File): Promise<void> => {
    dispatch({ type: 'SET_MODE', mode: 'offline' })
    const ocrResult = await extractPrescriptionTextOffline(file)
    const meds = parseOcrToMeds(ocrResult.rawText, ocrResult.confidence)

    // Interaction check requires network (OpenFDA + Groq). Never run from
    // the offline/fallback path (navigator.onLine can be stale during TypeError
    // fallback — the actual request already failed).
    const interactions: DrugInteraction[] = []

    const offlineResult: ScriptGuardResult = {
      id: `offline-${Date.now()}`,
      extracted_drugs: meds,
      interaction_warnings: interactions,
      has_dangerous_interactions: interactions.some(
        (i) => i.severity === 'Severe' || i.severity === 'Critical'
      ),
      gemini_raw: {
        raw_text: ocrResult.rawText,
        medications: meds.map((m: ExtractedMedication) => ({
          written_text: m.written_text,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions,
        })),
        prescriber_qualification: null,
        prescription_date: null,
        ocr_confidence: ocrResult.confidence,
      },
      schedule: { morning: [], afternoon: [], evening: [], night: [] },
      duration_days: 0,
      special_instructions_en: [],
      special_instructions_bn: [],
      audio_script_bn: '',
    }

    dispatch({ type: 'SET_RESULT', result: offlineResult })

    try {
      await enqueueAnalysis('scriptguard', file, offlineResult as unknown as Record<string, unknown>)
    } catch (queueErr) {
      console.warn('[ScriptGuard] Queue enqueue failed:', queueErr)
    }
  }, [])

  function friendlyOcrError(err: unknown): string {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'missing') {
      return 'Offline OCR isn\'t set up on this device yet — connect to the internet for analysis.'
    }
    if (msg === 'unsupported') {
      return 'Offline AI isn\'t supported on this device — please connect to the internet for analysis.'
    }
    return msg || 'Offline analysis failed.'
  }

  const analyze = useCallback(
    async (file: File) => {
      clearTimer()
      dispatch({ type: 'START_LOADING' })

      // Use refs for fresh values + direct navigator.onLine check to avoid
      // stale closures from useCallback + React batching delays.
      const actuallyOnline = typeof navigator !== 'undefined'
        ? navigator.onLine
        : isOnlineRef.current
      const ocrStatus = statusRef.current

      // Explicitly offline — use OCR worker if available (idle/ready)
      if (!actuallyOnline) {
        if (ocrStatus !== 'missing' && ocrStatus !== 'unsupported') {
          try {
            await runOfflineAnalysis(file)
          } catch (err) {
            dispatch({ type: 'SET_ERROR', error: friendlyOcrError(err) })
          }
          return
        }
        dispatch({
          type: 'SET_ERROR',
          error: ocrStatus === 'missing'
            ? 'Offline OCR isn\'t set up on this device yet — connect to the internet for analysis.'
            : 'Offline AI isn\'t supported on this device — please connect to the internet for analysis.',
        })
        return
      }

      // Online path — attempt fetch
      const controller = new AbortController()
      timeoutRef.current = setTimeout(() => controller.abort(), TIMEOUT_MS)

      try {
        dispatch({ type: 'SET_MODE', mode: 'online' })
        const formData = new FormData()
        formData.append('image', file)

        const response = await fetch('/api/scriptguard/analyze', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        })

        const payload = (await response.json().catch(() => null)) as
          | ApiSuccess<ScriptGuardResult>
          | ApiError
          | null

        if (!response.ok || !payload || !payload.success) {
          const apiError = payload && !payload.success ? payload : null
          throw new Error(
            apiError?.error_bn || apiError?.error || 'Analysis failed. Please try again.'
          )
        }

        dispatch({ type: 'SET_RESULT', result: payload.data })
      } catch (err) {
        // Network failure (TypeError: Failed to fetch / ERR_INTERNET_DISCONNECTED)
        // happens when navigator.onLine was still true but connectivity dropped.
        // Fall back to offline OCR pipeline.
        if (err instanceof TypeError) {
          try {
            await runOfflineAnalysis(file)
            return
          } catch (offlineErr) {
            dispatch({ type: 'SET_ERROR', error: friendlyOcrError(offlineErr) })
            return
          }
        }
        const message =
          err instanceof DOMException && err.name === 'AbortError'
            ? 'The request took too long. Please try again. / সময় শেষ হয়ে গেছে।'
            : err instanceof Error
              ? err.message
              : 'Something went wrong. Please try again.'
        dispatch({ type: 'SET_ERROR', error: message })
      } finally {
        clearTimer()
      }
    },
    [clearTimer, runOfflineAnalysis]
  )

  return {
    analyze,
    result: state.result,
    isLoading: state.isLoading,
    isError: state.isError,
    error: state.error,
    reset,
    mode: state.mode,
    offlineStatus: state.offlineStatus,
  }
}
