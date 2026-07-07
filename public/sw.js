// ====================================================================
// ShasthyaHub-AI Service Worker — Single Source of Truth
// ====================================================================
// This file is the ONLY service worker used in both dev and production.
// app/sw.ts.future is a preserved reference (dead code under Turbopack).
// Edit this file directly; do NOT maintain a parallel implementation.
// ====================================================================

const CACHE = 'shasthyahub-v2'
const STATIC_CACHE = 'shasthyahub-static-v2'
const NAV_CACHE = 'shasthyahub-nav-v2'
const RSC_PREFETCH_CACHE = 'pages-rsc-prefetch'
const RSC_NAV_CACHE = 'pages-rsc'
const MODELS_CACHE = 'shasthyahub-models-v4'
const OCR_CACHE = 'shasthyahub-ocr-v8'

const PRECACHE_URLS = ['/login', '/offline', '/manifest.json']

const ALL_PAGES = [
  '/',
  '/nayan-ai',
  '/scriptguard',
  '/glycovision',
  '/reports',
  '/debug-offline',
]

// ── Install ──────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(
        PRECACHE_URLS.map((url) => cache.add(url).catch(() => {}))
      )
    )
  )
  self.skipWaiting()
})

// ── Activate + cache-all pages ───────────────────────────────────

async function cacheAllPages() {
  const navCache = await caches.open(NAV_CACHE)
  const rscCache = await caches.open(RSC_NAV_CACHE)
  const rscPrefetchCache = await caches.open(RSC_PREFETCH_CACHE)

  const rscHeaders = {
    'RSC': '1',
    'Next-Router-State-Tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
  }

  const tasks = ALL_PAGES.flatMap((url) => [
    // Warm document/HTML cache (for hard refresh)
    fetch(url)
      .then((res) => {
        if (res.ok && res.type === 'basic') navCache.put(url, res)
      })
      .catch(() => {}),
    // Warm RSC navigation cache (for <Link> clicks)
    fetch(url, { headers: { ...rscHeaders } })
      .then((res) => {
        if (res.ok && res.type === 'basic') rscCache.put(url, res)
      })
      .catch(() => {}),
    // Warm RSC prefetch cache (for <Link> hover)
    fetch(url, {
      headers: { ...rscHeaders, 'Next-Router-Prefetch': '1' },
    })
      .then((res) => {
        if (res.ok && res.type === 'basic') rscPrefetchCache.put(url, res)
      })
      .catch(() => {}),
  ])

  const results = await Promise.allSettled(tasks)
  const fulfilled = results.filter((r) => r.status === 'fulfilled').length
  console.log(`[SW] Warmed ${fulfilled}/${tasks.length} cache entries (${ALL_PAGES.length} pages x 3 caches)`)
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                k !== CACHE &&
                k !== STATIC_CACHE &&
                k !== NAV_CACHE &&
                k !== RSC_PREFETCH_CACHE &&
                k !== RSC_NAV_CACHE &&
                k !== MODELS_CACHE &&
                k !== OCR_CACHE
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => cacheAllPages())
      // Model file prefetch — caches both model.json and weight shards so TF.js can
      // load offline. Runs inside waitUntil so the SW stays alive until both files
      // are fully downloaded.
      .then(() => {
        const MODEL_FILES = [
          '/models/nayan-ai/model.json',
          '/models/nayan-ai/group1-shard1of1.bin',
        ]
        return caches.open(MODELS_CACHE).then((cache) =>
          Promise.allSettled(
            MODEL_FILES.map((url) =>
              fetch(url)
                .then((res) => {
                  if (res.ok) return bufferAndClone(res).then((bufRes) => cache.put(url, bufRes))
                })
                .catch(() => {})
            )
          )
        )
      })
      // OCR language pack prefetch — caches Tesseract.js traineddata + WASM core
      // so OCR can run fully offline. Runs inside waitUntil to keep SW alive.
      .then(() => {
        const OCR_FILES = [
          '/tesseract-lang/eng.traineddata',
          '/tesseract-lang/ben.traineddata',
          '/tesseract-lang/tesseract-core.wasm.js',
          '/tesseract-lang/tesseract-core.wasm',
          '/tesseract-lang/tesseract-core-lstm.wasm.js',
          '/tesseract-lang/tesseract-core-lstm.wasm',
          '/tesseract-lang/tesseract-core-simd-lstm.wasm.js',
          '/tesseract-lang/tesseract-core-simd-lstm.wasm',
          '/tesseract-lang/tesseract-worker.min.js',
        ]
        return caches.open(OCR_CACHE).then((cache) =>
          Promise.allSettled(
            OCR_FILES.map((url) =>
              fetch(url)
                .then((res) => {
                  if (res.ok) {
                    return bufferAndClone(res).then((bufRes) => {
                      console.log('[SW] prefetched', url, bufRes.headers.get('Content-Length'))
                      return cache.put(url, bufRes)
                    })
                  } else {
                    console.warn('[SW] Non-ok response for', url, res.status)
                  }
                })
                .catch(() => { console.warn('[SW] Failed to prefetch OCR file:', url) })
            )
          )
        )
      })
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'cache-all') {
    event.waitUntil(cacheAllPages())
  }
})

// ── Background Sync ──────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-analyses') {
    event.waitUntil(syncPendingAnalyses())
  }
})

async function syncPendingAnalyses() {
  try {
    const db = await openQueueDB()
    const tx = db.transaction('pending-analyses', 'readonly')
    const store = tx.objectStore('pending-analyses')
    const index = store.index('status')
    const pendingItems = await index.getAll('pending')

    const endpointMap = {
      nayan: '/api/nayan/analyze',
      scriptguard: '/api/scriptguard/analyze',
      glycovision: '/api/glycovision/analyze',
    }

    for (const item of pendingItems) {
      if (item.id == null) continue
      const endpoint = endpointMap[item.agentType]
      if (!endpoint) continue
      try {
        const formData = new FormData()
        formData.append('image', item.imageBlob, 'offline-sync.jpg')
        formData.append('mode', 'offline')
        formData.append('localResult', JSON.stringify(item.localResult))
        const res = await fetch(endpoint, { method: 'POST', body: formData })
        const writeTx = db.transaction('pending-analyses', 'readwrite')
        const stored = await writeTx.objectStore('pending-analyses').get(item.id)
        if (stored) {
          stored.status = res.ok ? 'synced' : 'failed'
          if (res.ok) stored.syncedAt = Date.now()
          else stored.retryCount += 1
          await writeTx.objectStore('pending-analyses').put(stored)
        }
      } catch {
        const writeTx = db.transaction('pending-analyses', 'readwrite')
        const stored = await writeTx.objectStore('pending-analyses').get(item.id)
        if (stored) {
          stored.status = 'failed'
          stored.retryCount += 1
          await writeTx.objectStore('pending-analyses').put(stored)
        }
      }
    }
  } catch (err) {
    console.error('[SW] Sync error:', err)
  }
}

function openQueueDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('shasthyahub-offline-queue', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('pending-analyses')) {
        const store = db.createObjectStore('pending-analyses', {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('status', 'status')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ── Cache-key normalization helpers ───────────────────────────────

// Strip _rsc query param from URLs so RSC payloads with different cache-busting
// tokens share the same cache entry. Without this, every <Link> navigation gets a
// different _rsc value and misses the cache after the first offline hit.
function stripRsc(url) {
  const u = new URL(url)
  u.searchParams.delete('_rsc')
  return u.toString()
}

// ── Response buffering helper ────────────────────────────────────

// Next.js serves .wasm/.js files without Content-Length (chunked). When
// cache.put() receives a streaming response with certain Content-Types
// (application/wasm, application/javascript), Chromium may store 0 bytes.
// Reading the body into an ArrayBuffer and constructing a new Response
// with explicit Content-Length forces correct storage in Cache Storage.
function bufferAndClone(res) {
  return res.arrayBuffer().then((buf) => {
    const headers = new Headers(res.headers)
    headers.set('Content-Length', buf.byteLength.toString())
    return new Response(buf, {
      status: res.status,
      statusText: res.statusText,
      headers,
    })
  })
}

// ── Network-first with timeout helper ────────────────────────────

function networkFirstWithTimeout(request, timeoutSeconds) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), timeoutSeconds * 1000)
  )
  return Promise.race([fetch(request), timeoutPromise])
    .then((response) => {
      if (response.ok && response.type === 'basic') {
        const clone = response.clone()
        caches.open(NAV_CACHE).then((cache) => cache.put(request, clone))
      }
      return response
    })
    .catch(() =>
      caches.match(request).then((cached) => cached || caches.match('/offline'))
    )
}

// ── Fetch handler ────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Skip HMR
  if (url.pathname.match(/\.hot-update\.(json|js)$/)) return

  // ── API calls: network-only ──────────────────────────────────────
  if (url.pathname.startsWith('/api/')) return

  // ── RSC prefetch (hover on <Link>) ──────────────────────────────
  if (
    req.headers.get('RSC') === '1' &&
    req.headers.get('Next-Router-Prefetch') === '1'
  ) {
    const cacheKey = stripRsc(req.url)
    event.respondWith(
      caches.open(RSC_PREFETCH_CACHE).then((cache) =>
        cache.match(cacheKey).then((cached) => {
          const fetchPromise = fetch(req)
            .then((res) => {
              if (res.ok && res.type === 'basic') cache.put(cacheKey, res.clone())
              return res
            })
            .catch(() => cached)
          return cached || fetchPromise
        })
      )
    )
    return
  }

  // ── RSC navigation (click on <Link>) ────────────────────────────
  if (req.headers.get('RSC') === '1') {
    const cacheKey = stripRsc(req.url)
    event.respondWith(
      caches.open(RSC_NAV_CACHE).then((cache) =>
        cache.match(cacheKey).then((cached) => {
          const fetchPromise = fetch(req)
            .then((res) => {
              if (res.ok && res.type === 'basic') cache.put(cacheKey, res.clone())
              return res
            })
            .catch(() => cached)
          return cached || fetchPromise
        })
      )
    )
    return
  }

  // ── Model assets: cache-first ───────────────────────────────────
  if (url.pathname.startsWith('/models/')) {
    event.respondWith(
      caches.open(MODELS_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          if (cached) return cached
          return fetch(req)
            .then((res) => {
              if (res.ok) cache.put(req, res.clone())
              return res
            })
            .catch(() => new Response('Model not cached', { status: 404 }))
        })
      )
    )
    return
  }

  // ── OCR language packs + WASM: cache-first ─────────────────────
  if (url.pathname.startsWith('/tesseract-lang/')) {
    event.respondWith(
      caches.open(OCR_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          if (cached) return cached
          return fetch(req).then((res) => {
            if (res.ok) {
              // Use buffered response to avoid Chromium 0-byte storage bug
              // with chunked application/wasm and application/javascript.
              bufferAndClone(res).then((bufRes) => cache.put(req, bufRes))
            }
            return res
          })
        })
      )
    )
    return
  }

  // ── Static assets: cache-first ──────────────────────────────────
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          if (cached) return cached
          return fetch(req)
            .then((res) => {
              if (res.ok) cache.put(req, res.clone())
              return res
            })
            .catch(() => cached || new Response('', { status: 408 }))
        })
      )
    )
    return
  }

  // ── Navigation: network-first with 3s timeout ───────────────────
  if (
    req.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.startsWith('/_not-found')
  ) {
    event.respondWith(networkFirstWithTimeout(req, 3))
    return
  }

  // ── Everything else (fonts, images, JS): cache-first ────────────
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached
      return fetch(req)
        .then((res) => {
          if (res.ok && res.type === 'basic') {
            const clone = res.clone()
            caches.open(CACHE).then((cache) => cache.put(req, clone))
          }
          return res
        })
        .catch(() => cached || new Response('', { status: 408 }))
    })
  )
})
