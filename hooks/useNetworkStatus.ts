'use client'

import { useState, useEffect, useSyncExternalStore, startTransition, useRef } from 'react'

const HEALTH_CHECK_INTERVAL = 10_000

function getServerSnapshot(): boolean {
  return true
}

function getSnapshot(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

let abortController: AbortController | null = null

async function checkReachable(): Promise<boolean> {
  abortController?.abort()
  const controller = new AbortController()
  abortController = controller
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch('/api/health', {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    })
    return res.status !== 0
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
    if (abortController === controller) {
      abortController = null
    }
  }
}

export function useNetworkStatus() {
  const rawOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [isOnline, setIsOnline] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Immediate check on rawOnline change
  useEffect(() => {
    if (!rawOnline) {
      startTransition(() => setIsOnline(false))
    } else {
      checkReachable().then(setIsOnline)
    }
  }, [rawOnline])

  // Periodic re-check while nominally online
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (!rawOnline) return
    intervalRef.current = setInterval(async () => {
      const ok = await checkReachable()
      startTransition(() => setIsOnline(ok))
    }, HEALTH_CHECK_INTERVAL)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [rawOnline])

  return { isOnline }
}
