'use client'

import { useCallback, useState } from 'react'
import type { ApiError, ApiSuccess, LokhonAnswer, LokhonResult } from '@/types'

interface UseLokhonAnalysisReturn {
  analyze: (diseaseSlug: string, answers: LokhonAnswer[]) => Promise<void>
  result: LokhonResult | null
  isLoading: boolean
  isError: boolean
  error: string | null
  reset: () => void
}

export function useLokhonAnalysis(): UseLokhonAnalysisReturn {
  const [result, setResult] = useState<LokhonResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setResult(null)
    setIsLoading(false)
    setIsError(false)
    setError(null)
  }, [])

  const analyze = useCallback(async (diseaseSlug: string, answers: LokhonAnswer[]) => {
    setIsLoading(true)
    setIsError(false)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/lokhon/${diseaseSlug}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diseaseSlug, answers }),
      })

      const payload = (await response.json().catch(() => null)) as
        | ApiSuccess<LokhonResult>
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
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { analyze, result, isLoading, isError, error, reset }
}
