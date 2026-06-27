'use client'

import { useCallback, useRef, useState } from 'react'
import type { ApiError, ApiSuccess, GlycoVisionResult } from '@/types'

interface UseGlycoVisionAnalysisReturn {
  analyze: (file: File) => Promise<void>
  result: GlycoVisionResult | null
  isLoading: boolean
  isError: boolean
  error: string | null
  reset: () => void
}

const TIMEOUT_MS = 60_000

export function useGlycoVisionAnalysis(): UseGlycoVisionAnalysisReturn {
  const [result, setResult] = useState<GlycoVisionResult | null>(null)
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

        const response = await fetch('/api/glycovision/analyze', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        })

        const payload = (await response.json().catch(() => null)) as
          | ApiSuccess<GlycoVisionResult>
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
