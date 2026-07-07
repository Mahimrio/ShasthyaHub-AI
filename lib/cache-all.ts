'use client'

export function sendCacheAll() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage('cache-all')
  }
}
