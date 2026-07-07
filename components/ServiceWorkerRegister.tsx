'use client'

import { useEffect } from 'react'
import { sendCacheAll } from '@/lib/cache-all'

export function ServiceWorkerRegister() {
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost'

    if (isDev) {
      console.warn(
        '[SW] Dev-mode SW active — offline behavior may differ from production. ' +
        'Run `npm run build && npm run start` to test real offline behavior.'
      )
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        const trySend = () => {
          if (reg.active) {
            sendCacheAll()
          }
        }

        trySend()

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing
          if (installing) {
            installing.addEventListener('statechange', () => {
              if (installing.state === 'activated') trySend()
            })
          }
        })
      }).catch(() => {})
    }
  }, [])

  return null
}
