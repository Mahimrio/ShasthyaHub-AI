'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiError, ApiSuccess, NayanResult } from '@/types'
import { useNetworkStatus } from './useNetworkStatus'
import {
  getModelStatus,
  analyzeEyeImageOffline,
  getSeverityStrings,
} from '@/lib/ai/tensorflow-nayan'
import type { NayanModelStatus } from '@/lib/ai/tensorflow-nayan'
import { enqueueAnalysis } from '@/lib/offline-queue'

interface UseNayanAnalysisReturn {
  analyze: (file: File) => Promise<void>
  result: NayanResult | null
  isLoading: boolean
  isError: boolean
  error: string | null
  reset: () => void
  analysisMode: 'online' | 'offline' | null
  offlineModelStatus: NayanModelStatus
  isUpgrading: boolean
}

const TIMEOUT_MS = 60_000

function mapOfflineResult(
  offlineSeverity: 'normal' | 'refer' | 'urgent',
  confidence: number
): NayanResult {
  const severityMap: Record<string, NayanResult['severity']> = {
    normal: 'Normal',
    refer: 'Medium',
    urgent: 'High',
  }
  const severity = severityMap[offlineSeverity]
  const strings = getSeverityStrings()[offlineSeverity]

  return {
    id: `offline-${crypto.randomUUID()}`,
    diagnosis:
      severity === 'Normal'
        ? 'No diabetic retinopathy detected'
        : severity === 'Medium'
          ? 'Mild diabetic retinopathy suspected'
          : 'Advanced diabetic retinopathy suspected',
    severity,
    recommendation_en: strings.en,
    recommendation_bn: strings.bn,
    urgency_days: offlineSeverity === 'urgent' ? 7 : offlineSeverity === 'refer' ? 30 : 365,
    next_steps:
      offlineSeverity === 'normal'
        ? [
            'Schedule a routine eye exam within 6 months.',
            'Monitor blood sugar levels regularly.',
            'Maintain a healthy diet and exercise routine.',
          ]
        : offlineSeverity === 'refer'
          ? [
              'Consult an ophthalmologist within 30 days.',
              'Get a dilated eye exam for detailed evaluation.',
              'Continue blood sugar monitoring.',
            ]
          : [
              'Seek immediate ophthalmologist consultation.',
              'Do not wait — visit an eye care center today.',
              'Bring this preliminary report for the specialist.',
            ],
    specialist_needed:
      offlineSeverity === 'normal'
        ? 'General Ophthalmologist'
        : 'Retina Specialist',
    confidence_score: confidence,
    analysis_mode: 'offline',
  }
}

export function useNayanAnalysis(): UseNayanAnalysisReturn {
  const [result, setResult] = useState<NayanResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisMode, setAnalysisMode] = useState<'online' | 'offline' | null>(null)
  const [offlineModelStatus, setOfflineModelStatus] = useState<NayanModelStatus>(getModelStatus())
  const [isUpgrading, setIsUpgrading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastOfflineFileRef = useRef<File | null>(null)
  const lastOfflineResultRef = useRef<NayanResult | null>(null)

  const { isOnline } = useNetworkStatus()

  useEffect(() => {
    const interval = setInterval(() => {
      setOfflineModelStatus(getModelStatus())
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (
      isOnline &&
      lastOfflineFileRef.current &&
      lastOfflineResultRef.current
    ) {
      const file = lastOfflineFileRef.current
      const offlineResult = lastOfflineResultRef.current

      setIsUpgrading(true)

      const controller = new AbortController()
      const formData = new FormData()
      formData.append('image', file)
      formData.append('mode', 'offline')
      formData.append('localResult', JSON.stringify(offlineResult))

      fetch('/api/nayan/analyze', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
        .then(async (res) => {
          const payload = (await res.json().catch(() => null)) as
            | ApiSuccess<NayanResult>
            | ApiError
            | null
          if (res.ok && payload && payload.success) {
            setResult({ ...payload.data, analysis_mode: 'online' })
            setAnalysisMode('online')
            lastOfflineFileRef.current = null
            lastOfflineResultRef.current = null
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsUpgrading(false)
        })
    }
  }, [isOnline])

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
    setAnalysisMode(null)
    setIsUpgrading(false)
    lastOfflineFileRef.current = null
    lastOfflineResultRef.current = null
  }, [clearTimer])

  const runOffline = useCallback(
    async (file: File) => {
      try {
        const img = await fileToImage(file)
        const offlineResult = await analyzeEyeImageOffline(img)
        const mapped = mapOfflineResult(offlineResult.severity, offlineResult.confidence)

        setResult(mapped)
        setAnalysisMode('offline')
        lastOfflineFileRef.current = file
        lastOfflineResultRef.current = mapped
        setOfflineModelStatus(getModelStatus())

        enqueueAnalysis('nayan', file, mapped as unknown as Record<string, unknown>).catch(
          (err) => console.warn('[NayanAnalysis] Queue failed:', err)
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Offline analysis failed.'
        console.error('[NayanAnalysis] Offline path threw:', err)
        setOfflineModelStatus(getModelStatus())
        setError(message)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const analyze = useCallback(
    async (file: File) => {
      clearTimer()
      setIsLoading(true)
      setIsError(false)
      setError(null)
      setResult(null)
      setAnalysisMode(null)

      if (isOnline) {
        const controller = new AbortController()
        timeoutRef.current = setTimeout(() => controller.abort(), TIMEOUT_MS)

        try {
          const formData = new FormData()
          formData.append('image', file)

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
            if (response.status === 429) {
              clearTimer()
              console.warn('[NayanAnalysis] API rate limited, falling back to offline model')
              await runOffline(file)
              return
            }
            throw new Error(
              apiError?.error_bn || apiError?.error || 'Analysis failed. Please try again.'
            )
          }

          setResult({ ...payload.data, analysis_mode: 'online' })
          setAnalysisMode('online')
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            setError('The request took too long. Please try again. / সময় শেষ হয়ে গেছে। আবার চেষ্টা করুন।')
          } else if (err instanceof TypeError) {
            // Network error (ERR_INTERNET_DISCONNECTED, Failed to fetch, etc.)
            clearTimer()
            console.warn('[NayanAnalysis] Network error, falling back to offline model')
            await runOffline(file)
            return
          } else {
            const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
            if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('quota')) {
              clearTimer()
              console.warn('[NayanAnalysis] API quota exhausted, falling back to offline model')
              await runOffline(file)
              return
            }
            setError(msg)
          }
          setIsError(true)
        } finally {
          clearTimer()
          setIsLoading(false)
        }
      } else {
        await runOffline(file)
      }
    },
    [clearTimer, isOnline, runOffline]
  )

  return {
    analyze,
    result,
    isLoading,
    isError,
    error,
    reset,
    analysisMode,
    offlineModelStatus,
    isUpgrading,
  }
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      resolve(img)
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to decode image'))
    }
    img.src = url
  })
}
