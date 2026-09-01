'use client'

import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useNetworkStatus } from './useNetworkStatus'
import type { ApiError, ApiSuccess, ScriptGuardResult } from '@/types'

interface State {
  result: ScriptGuardResult | null
  isLoading: boolean
  isError: boolean
  error: string | null
  mode: 'online' | null
}

type Action =
  | { type: 'START_LOADING' }
  | { type: 'SET_RESULT'; result: ScriptGuardResult }
  | { type: 'UPDATE_RESULT'; result: ScriptGuardResult }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'RESET' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_LOADING':
      return { ...state, isLoading: true, isError: false, error: null, result: null }
    case 'SET_RESULT':
      return { ...state, result: action.result, isLoading: false, mode: 'online' }
    case 'UPDATE_RESULT':
      return { ...state, result: action.result }
    case 'SET_ERROR':
      return { ...state, error: action.error, isError: true, isLoading: false }
    case 'RESET':
      return { result: null, isLoading: false, isError: false, error: null, mode: null }
  }
}

const initialState: State = {
  result: null,
  isLoading: false,
  isError: false,
  error: null,
  mode: null,
}

// Slightly above the server's 60s cap (vercel maxDuration)
const TIMEOUT_MS = 75_000

export function useScriptGuardAnalysis() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isOnlineRef = useRef(true)
  const { isOnline } = useNetworkStatus()

  useEffect(() => {
    isOnlineRef.current = isOnline
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

  const analyze = useCallback(
    async (file: File) => {
      clearTimer()
      dispatch({ type: 'START_LOADING' })

      const actuallyOnline =
        typeof navigator !== 'undefined' ? navigator.onLine : isOnlineRef.current

      // ScriptGuard requires active online connection
      if (!actuallyOnline) {
        dispatch({
          type: 'SET_ERROR',
          error:
            'প্রেসক্রিপশন বিশ্লেষণের জন্য সক্রিয় ইন্টারনেট সংযোগ প্রয়োজন। অনুগ্রহ করে ইন্টারনেটে যুক্ত হয়ে আবার চেষ্টা করুন। / Prescription analysis requires an active internet connection. Please connect to the internet and try again.',
        })
        return
      }

      const controller = new AbortController()
      timeoutRef.current = setTimeout(() => controller.abort(), TIMEOUT_MS)

      try {
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
        if (err instanceof TypeError) {
          dispatch({
            type: 'SET_ERROR',
            error:
              'ইন্টারনেট সংযোগ বিচ্ছিন্ন হয়েছে। প্রেসক্রিপশন বিশ্লেষণের জন্য সক্রিয় ইন্টারনেট প্রয়োজন। / Network connection lost. Prescription analysis requires an internet connection.',
          })
          return
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
    [clearTimer]
  )

  const updateResult = useCallback((newResult: ScriptGuardResult) => {
    dispatch({ type: 'UPDATE_RESULT', result: newResult })
  }, [])

  return {
    analyze,
    result: state.result,
    isLoading: state.isLoading,
    isError: state.isError,
    error: state.error,
    reset,
    mode: state.mode,
    updateResult,
  }
}

