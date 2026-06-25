'use client'

import { useCallback, useRef, useState } from 'react'
import type { ApiError, ApiSuccess, ScriptGuardResult } from '@/types'

interface UseScriptGuardAnalysisReturn {
  analyze: (file: File) => Promise<void>
  result: ScriptGuardResult | null
  isLoading: boolean
  isError: boolean
  error: string | null
  reset: () => void
}

const TIMEOUT_MS = 60_000

/**
 * One-shot mutation hook for ScriptGuard prescription analysis.
 *
 * POSTs the image as multipart/form-data to /api/scriptguard/analyze. Uses fetch
 * (not axios) so the browser sets the correct multipart Content-Type boundary
 * automatically — setting it manually breaks file uploads.
 *
 * Aborts after TIMEOUT_MS via an AbortController so a stalled request can't
 * leave the UI in a perpetual loading state.
 */
export function useScriptGuardAnalysis(): UseScriptGuardAnalysisReturn {
  const [result, setResult] = useState<ScriptGuardResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

        setResult(payload.data)
      } catch (err) {
        const message =
          err instanceof DOMException && err.name === 'AbortError'
            ? 'The request took too long. Please try again. / সময় শেষ হয়ে গেছে।'
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
