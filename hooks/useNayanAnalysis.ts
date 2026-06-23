'use client'

import { useCallback, useRef, useState } from 'react'
import type { ApiError, ApiSuccess, NayanResult } from '@/types'

interface UseNayanAnalysisReturn {
  analyze: (file: File) => Promise<void>
  result: NayanResult | null
  isLoading: boolean
  isError: boolean
  error: string | null
  reset: () => void
}

const TIMEOUT_MS = 60_000

/**
 * One-shot mutation hook for Nayan AI eye analysis.
 *
 * POSTs the image as multipart/form-data to /api/nayan/analyze. Uses fetch
 * (not axios) so the browser sets the correct multipart Content-Type boundary
 * automatically — setting it manually breaks file uploads.
 *
 * Aborts after TIMEOUT_MS via an AbortController so a stalled request can't
 * leave the UI in a perpetual loading state.
 */
export function useNayanAnalysis(): UseNayanAnalysisReturn {
  const [result, setResult] = useState<NayanResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Tracks the in-flight timeout so we can clear it on settle/unmount.
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    clearTimer()
    setResult(null)
    setIsLoading(false)
    setIsError(false)
    setError(null)
  }, [clearTimer])

  const analyze = useCallback(
    async (file: File) => {
      // Reset any previous run before starting a new one.
      clearTimer()
      setIsLoading(true)
      setIsError(false)
      setError(null)
      setResult(null)

      const controller = new AbortController()
      timeoutRef.current = setTimeout(() => controller.abort(), TIMEOUT_MS)

      try {
        const formData = new FormData()
        formData.append('image', file)

        // NOTE: do NOT set Content-Type — fetch injects the multipart boundary.
        const response = await fetch('/api/nayan/analyze', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        })

        const payload = (await response.json().catch(() => null)) as
          | ApiSuccess<NayanResult>
          | ApiError
          | null

        if (!response.ok || !payload || !payload.success) {
          const apiError = payload && !payload.success ? payload : null
          throw new Error(
            apiError?.error_bn || apiError?.error || 'Analysis failed. Please try again.'
          )
        }

        setResult(payload.data)
      } catch (err) {
        const message =
          err instanceof DOMException && err.name === 'AbortError'
            ? 'The request took too long. Please try again. / সময় শেষ হয়ে গেছে। আবার চেষ্টা করুন।'
            : err instanceof Error
              ? err.message
              : 'Something went wrong. Please try again.'
        setError(message)
        setIsError(true)
      } finally {
        clearTimer()
        setIsLoading(false)
      }
    },
    [clearTimer]
  )

  return { analyze, result, isLoading, isError, error, reset }
}
