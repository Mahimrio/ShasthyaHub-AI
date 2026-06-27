const CACHE = 'shasthyahub-v1'

const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Only cache same-origin, non-API requests (avoid caching private JSON responses)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  const url = new URL(event.request.url)
  if (url.pathname.match(/\.hot-update\.(json|js)$/)) return

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const clone = response.clone()
            caches.open(CACHE).then((cache) => cache.put(req, clone))
          }
          return response
        })
        .catch(() => cached || caches.match('/offline'))

      return cached || fetchPromise
    })
  )
})
