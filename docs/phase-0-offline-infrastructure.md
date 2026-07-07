# Phase 0 — Offline Infrastructure Documentation

## Overview

Phase 0 establishes the foundational offline infrastructure for ShasthyaHub-AI:
a PWA that works reliably on rural Bangladeshi networks (3G, flaky
connectivity, frequent disconnections). It covers network detection, an
IndexedDB-backed offline queue with image compression, a service worker
for caching and background sync, the Supabase schema migration, and a
debug testing page.

---

## Architecture Decisions

| Decision | Rationale |
|---|---|
| **Pessimistic online detection** | `isOnline` defaults to `true` for SSR hydration safety; flips to `false` instantly when `navigator.onLine` drops or health-check fails. Requires a confirmed health-check before declaring online. |
| **`clients.claim()` re-enabled** | Previously omitted due to an infinite reload loop in dev mode. Root cause: the SW file is rewritten under HMR on every edit, causing the SW to re-install → `clients.claim()` → Chrome reloads → repeat. In production the SW file is static, so `clients.claim()` is safe. Required for the SW to control RSC navigation requests immediately after activation. |
| **Raw IndexedDB in dev SW** | The dev-mode `public/sw.js` uses raw IndexedDB (not `idb` package) because service workers can't import ESM from `node_modules` without bundling. Serwist handles bundling for production. |
| **WebP compression before IndexedDB write** | Phone cameras produce 5–10 MB JPEGs. Compression to <150 KB WebP prevents IndexedDB storage quota exhaustion on budget devices. |
| **`navigator.storage.persist()`** | Mobile browsers silently evict IndexedDB data under storage pressure unless the origin has persistent storage. Called on queue init; logs the grant result. |
| **Background Sync as progressive enhancement** | Chromium-only API. Feature-detected before registration. Falls back to `window.addEventListener('online')` re-submit on iOS/Safari. |

---

## Files Created / Modified

### New Files

#### `hooks/useNetworkStatus.ts`
React hook for online/offline detection.
- Uses `useSyncExternalStore` for `navigator.onLine` (SSR-safe with `getServerSnapshot` returning `true`).
- Fires a HEAD request to `/api/health` every 10 s to detect cases where `navigator.onLine` is `true` but the network is unreachable (common on flaky rural connections).
- **Pessimistic**: offline is instant (no debounce); online requires a confirmed health-check response.
- Returns `{ isOnline: boolean }`.

#### `components/shared/AnalysisModeBadge.tsx`
A small pill badge showing connection status.
- Props: `mode: 'online' | 'offline'`.
- Green: "Verified · Online" / `নিশ্চিত · অনলাইন`.
- Amber: "Preliminary · Offline" / `প্রাথমিক · অফলাইন`.
- Uses `useLanguage()` for Bengali/English switching.

#### `lib/offline-queue.ts`
IndexedDB-backed queue for storing analysis results when offline.
- Uses the `idb` npm package (added to `package.json`).
- **`initQueue()`**: Opens DB, requests `navigator.storage.persist()`.
- **`enqueueAnalysis(agentType, imageBlob, localResult)`**: Compresses image to <150 KB WebP via `browser-image-compression`, stores in IndexedDB, registers Background Sync (`sync-analyses`).
- **`getPendingAnalyses()`**: Returns all items with `status: 'pending'`.
- **`getUnsyncedAnalyses()`**: Returns `pending` + `failed` items.
- **`markSynced(id)`**, **`markFailed(id)`**, **`markSyncing(id)`**: Status transitions.
- **`clearSynced()`**: Removes synced items from the store.
- **`getQueueLength()`**: Total item count.

#### `lib/cache-all.ts`
Utility to send a `cache-all` message to the active service worker.
- Called after login and on SW activation to trigger a full page cache.

#### `app/sw.ts.future` (previously `app/sw.ts`)
Preserved reference for a Serwist-compiled service worker. **Not used in production** —
Next.js 16 defaults to Turbopack, which is incompatible with Serwist's webpack-based
plugin. The hand-written `public/sw.js` is the single running service worker in all
environments. This file is kept as a reference if/when Serwist adds Turbopack support.
- Uses `defaultCache` from `@serwist/next/worker` as the base `runtimeCaching` array.
- Pre-registers 3 custom entries **before** `defaultCache` (first-match-wins):
  1. **API routes** (`/api/*`): `NetworkOnly`.
  2. **RSC prefetch**: `StaleWhileRevalidate` with `pages-rsc-prefetch` cache.
  3. **RSC navigation**: `StaleWhileRevalidate` with `pages-rsc` cache.
- Configures `skipWaiting: true`, `clientsClaim: true`, `navigationPreload: true`.
- Configures `fallbacks` → `/offline` for document requests.
- Contains the Background Sync handler (`sync-analyses`).

#### `app/(dashboard)/debug-offline/page.tsx`
Developer testing panel — not visible in production.
- Section 1: Network status, persistent storage grant status.
- Section 2: IndexedDB queue viewer (count, list with ID/agent/size/status).
- Section 3: Queue controls — "Inject Dummy Analysis", "Trigger Sync", "Clear Synced".
- Section 4: Service Worker registration status.
- Section 5: Live event log.

#### `supabase/migrations/002_add_analysis_mode.sql`
Adds `analysis_mode TEXT DEFAULT 'online'` column to:
- `eye_analyses`
- `prescription_analyses`
- `food_analyses`

Allows tracking which results were produced online vs offline.

#### `docs/phase-0-offline-infrastructure.md` *(this file)*

### Modified Files

#### `app/(dashboard)/layout.tsx`
- Added `useNetworkStatus()` to detect online/offline state.
- Added a thin amber banner below the header that appears only when offline:
  "You are offline — results are preliminary"
- Added `prefetch={false}` to all sidebar `<Link>` components to prevent RSC
  fetch errors when offline.
- Added "Debug" link in sidebar (bug icon).

#### `components/layout/BottomNav.tsx`
- Added "Debug" link (bug icon) for mobile access to the debug page.

#### `components/ServiceWorkerRegister.tsx`
- SW is now registered in all environments (not just production).
- Sends `cache-all` message after registration.
- Logs a console warning in dev mode: "Dev-mode SW active — offline
  behavior may differ from production; run `npm run build && npm run start`
  to test real offline behavior." Prevents future debugging time spent on
  dev-only artifacts.

#### `public/sw.js`
**Single source of truth** — the only service worker running in both dev and production.
(Next.js 16 uses Turbopack, which prevents Serwist from compiling `app/sw.ts.future`;
see that file for a reference implementation if Serwist ever gains Turbopack support.)
- **Header comment** explicitly declares it as the sole SW implementation.
- **Precache**: `/login`, `/offline`, `/manifest.json`.
- **Activate**: `clients.claim()` + cleans old caches + caches all 6 dashboard pages.
- **RSC prefetch** (hover on `<Link>`): `StaleWhileRevalidate` with `pages-rsc-prefetch` cache.
  Cache-key normalization via `stripRsc()` strips the `_rsc` query param so cache-busting
  tokens don't fragment cache entries across navigations.
- **RSC navigation** (click on `<Link>`): `StaleWhileRevalidate` with `pages-rsc` cache.
  Same `_rsc` normalization applied.
- **Navigation** (full document): Network-first with **3-second timeout** → cache → `/offline`.
- **Static assets** (`/_next/static/`): Cache-first (no offline fallback).
- **API calls** (`/api/*`): Network-only (never cache).
- **Background Sync**: Listens for `sync-analyses` tag, reads pending items from IndexedDB,
  re-POSTs to API, marks synced/failed.
- **Message handler**: Listens for `cache-all` message to re-cache all pages.
- Uses raw IndexedDB (no `idb` import) — avoids ESM import issues in SW context.

#### `scripts/check-env.mjs`
Updated to load `.env.local` automatically before checking env vars.
- The prebuild script runs via `node scripts/check-env.mjs` before Next.js
  has a chance to load `.env.local`. Previously it would falsely report
  missing variables on machines where the `.env.local` file exists but env
  vars aren't set in the shell.
- Now reads and parses `.env.local` directly, populating `process.env`
  so the audit passes correctly.

#### `public/manifest.json`
Fixed garbled Bengali text. Clean ASCII version.

#### `middleware.ts`
Added `Content-Security-Policy` header:
```
script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' 'unsafe-eval'
```
This allows WebAssembly execution (required by TensorFlow.js WASM backend
and Tesseract.js in later phases).

#### `next.config.ts`
Wrapped with `@serwist/next` (kept for future Serwist+Turbopack compatibility):
- `swSrc: "app/sw.ts.future"` — points to the preserved reference file.
- `disable: true` — Serwist compilation is always disabled. The hand-written
  `public/sw.js` is the single source of truth in all environments.
- `turbopack: {}` — Next.js 16 requires an explicit Turbopack config.

#### `tsconfig.json`
Excluded `app/sw.ts.future` from main type-check (not a live file).

#### `app/(auth)/login/page.tsx`
Calls `sendCacheAll()` after successful login to trigger full page cache.

#### `hooks/useAuth.ts`
Calls `sendCacheAll()` on `SIGNED_IN` auth event.

#### `package.json`
Added `idb` as a dependency.

---

## Service Worker Caching Strategy

### How Cache Storage Works

The service worker uses the **Cache Storage API** (`caches.open()`,
`cache.put()`, `cache.match()`) to store HTTP responses. When the SW
intercepts a `fetch` event, it can either:

1. **Serve from cache** — return a previously stored response immediately
   (fast, works offline).
2. **Fetch from network** — make the real HTTP request.
3. **Store after fetch** — after a successful network response, store a
   clone in cache for future offline use.
4. **Fallback** — if network fails and cache misses, show `/offline`.

### Five Caches (Two New RSC Caches)

| Cache Name | Contents | Strategy |
|---|---|---|
| `shasthyahub-v2` | Pre-cached URLs (`/login`, `/offline`, `/manifest.json`) + general resources (fonts, images, non-static JS) | Pre-cached on install; cache-first for subsequent requests |
| `shasthyahub-static-v2` | All `/_next/static/*` assets (JS bundles, CSS, chunks) | Cache-first — these files are versioned (hash in filename), so they never change. Once cached, always served from cache. No network needed after first load. |
| `shasthyahub-nav-v2` | Navigation HTML pages (`/`, `/nayan-ai`, `/scriptguard`, `/glycovision`, etc.) | Network-first with 3s timeout → cache → `/offline` |
| `pages-rsc-prefetch` | RSC payloads from `<Link>` hover prefetches | StaleWhileRevalidate — serve cached immediately, refresh in background |
| `pages-rsc` | RSC payloads from `<Link>` click navigations | StaleWhileRevalidate — serve cached immediately, refresh in background |

### When Each Page Gets Cached

There are **4 triggers** that store pages in the cache:

| Trigger | When | What Gets Cached | Cache |
|---|---|---|---|
| **SW install** | First time SW registers | `/login`, `/offline`, `/manifest.json` | `shasthyahub-v2` |
| **SW activate** | Right after SW activates | All 6 dashboard pages fetched in parallel via `cacheAllPages()` | `shasthyahub-nav-v2` |
| **User navigates** | Every time user visits a page while online | The visited page is stored via the fetch handler's `cache.put()` | `shasthyahub-nav-v2` |
| **Login / `cache-all` message** | After login or when page sends `cache-all` message to SW | All 6 dashboard pages re-fetched with auth cookies | `shasthyahub-nav-v2` |

The **activate trigger** uses the SW's own `fetch()` which includes the
browser's cookies (same-origin). If the user is already logged in when the
SW activates, all pages are cached in one shot. If not, they get cached
individually as the user visits them.

The **login trigger** sends a `cache-all` message from the page to the SW,
which re-fetches all pages with valid auth cookies, overwriting any
previously cached login redirects.

### Fetch Decision Tree

```
Request received from browser
    │
    ├── Is it HMR? (.hot-update.*)      →  Skip, let browser handle
    │
    ├── Is it an API call (/api/*)?     →  Network only (NetworkOnly, 10s timeout)
    │
    ├── Is it an RSC prefetch
    │   (RSC: 1 + Next-Router-Prefetch: 1)? →  StaleWhileRevalidate
    │                                           ├── In pages-rsc-prefetch cache?
    │                                           │   → Serve cached, fetch in
    │                                           │   background to refresh
    │                                           └── Not cached? → Fetch from
    │                                               network, store for offline
    │
    ├── Is it an RSC navigation
    │   (RSC: 1, no Prefetch header)?       →  StaleWhileRevalidate
    │                                           ├── In pages-rsc cache?
    │                                           │   → Serve cached immediately,
    │                                           │   fetch in bg to refresh
    │                                           └── Not cached? → Fetch from
    │                                               network, store for offline
    │
    ├── Is it a static asset
    │   (/_next/static/*)?              →  Cache-first
    │                                      ├── In cache? → Serve cached
    │                                      └── Not cached? → Fetch from
    │                                          network, store in
    │                                          shasthyahub-static-v2
    │
    ├── Is it a navigation request
    │   (mode=navigate or known route)? →  Network-first (3s timeout)
    │                                      ├── Online within 3s? → Fetch
    │                                      │   from network, store clone in
    │                                      │   shasthyahub-nav-v2, serve
    │                                      ├── Timeout or offline, in cache?
    │                                      │   → Serve cached HTML
    │                                      └── Not cached? → Serve /offline
    │
    └── Everything else (fonts, images,
        non-static JS)                  →  Cache-first
                                           ├── In cache? → Serve cached
                                           └── Not cached? → Fetch from
                                               network, store in
                                               shasthyahub-v2
```

> **RSC (React Server Components)** are the payloads Next.js uses for
> client-side navigation with `<Link>`. When the user hovers over a link,
> the browser sends an RSC prefetch request. When they click, it sends an
> RSC navigation request. Previously, both were skipped by the SW
> (`if (url.searchParams.has('_rsc')) return`), causing offline navigation
> to fail. Now they are cached via StaleWhileRevalidate, so cached RSC
> payloads are served instantly offline.
>
> **`_rsc` cache-key normalization**: RSC requests include a cache-busting
> `_rsc` query param that varies per navigation. The `stripRsc()` helper in
> `public/sw.js` strips this param from cache keys so all navigations to the
> same page share one cache entry. Without this, repeated offline navigations
> would miss the cache after the first hit.

### Cache Warming on Activate and Login (All Three Caches)

`cacheAllPages()` (in `public/sw.js`) and `warmCaches()` (in `app/sw.ts`)
now warm **three** caches for each dashboard page, not just one:

1. **Document/HTML cache** (`shasthyahub-nav-v2` / `pages`): fetched as
   a plain navigation request → serves hard-refreshes offline.
2. **RSC navigation cache** (`pages-rsc`): fetched with `RSC: 1` header
   → serves `<Link>` clicks offline.
3. **RSC prefetch cache** (`pages-rsc-prefetch`): fetched with
   `RSC: 1` + `Next-Router-Prefetch: 1` + `Next-Router-State-Tree` headers
   → serves `<Link>` hover prefetches offline.

This warming fires:
- **On SW `activate`** — immediately when the SW takes control.
- **On `cache-all` message** — sent after login completes, ensuring the
  user has full offline capability on first session.

The warming is **non-blocking** from the user's perspective: `cacheAllPages`
runs in `event.waitUntil()` which doesn't delay page interaction.

### Why `cache.addAll()` Was Replaced With `Promise.allSettled()`

`cache.addAll()` is **atomic** — if ANY URL in the array fails to fetch
(e.g. a page returns 302 redirect because not authenticated), the ENTIRE
batch fails and NOTHING gets cached.

We replaced it with:
```javascript
Promise.allSettled(PRECACHE_URLS.map(url =>
  cache.add(url).catch(() => {})
))
```

This way, failing pages don't block successful ones. `/offline` always
gets cached even if other auth-protected pages fail.

### Why `clients.claim()` is Now Re-Enabled

`clients.claim()` was previously omitted due to an infinite reload loop
observed in development. Investigation revealed the root cause:

- **Dev-mode HMR**: Turbopack rewrites the SW file (`public/sw.js`) on
  every file edit. Each rewrite triggers a SW byte-diff → browser detects
  update → new SW installs → `skipWaiting()` → `clients.claim()` →
  Chrome reloads the page → SW file changes again → repeat.
- **Production**: The SW file is static after build. It never changes
  until the next deployment. No rewrite → no re-install → no loop.

Since **offline testing must be done against a production build** (see
Testing section), `clients.claim()` is re-enabled with `skipWaiting: true`
in both `app/sw.ts` (Serwist) and `public/sw.js` (dev fallback).

This is critical because `clients.claim()` ensures the SW immediately
controls all open pages, which is necessary for the SW to intercept RSC
navigation requests on the very first interaction after activation.
Without it, RSC requests from pages loaded before the SW existed would
bypass the cache.

---

## Offline Queue Flow

```
User uploads image
    │
    ├── Online?  →  POST to /api/*/analyze as normal
    │
    └── Offline? →  1. Compress image to <150 KB WebP
                    2. Store in IndexedDB (status: 'pending')
                    3. Register Background Sync ('sync-analyses')
                    4. Show local/preliminary result to user

         ...
    Network reconnects
         │
         ├── Chromium:  Background Sync fires → SW reads IDB →
         │              re-POSTs to API → marks 'synced' or 'failed'
         │
         └── iOS/Safari: window 'online' event fires →
                         app reads IDB → re-POSTs (Phase 1+)
```

---

## Network Detection Strategy

```
isOnline = true (SSR default)
    │
    ├── navigator.onLine = false  →  isOnline = false (instant)
    │
    └── navigator.onLine = true   →  Immediate health check (HEAD /api/health)
         │                             5s timeout, cancels previous in-flight check
         │                             Interval: 10 s re-check while online
         ├── 200 OK               →  isOnline = true
         └── Error / timeout      →  isOnline = false
```

### Improvements Over Baseline

- **AbortController per check**: Each `checkReachable()` call cancels any
  previous in-flight check by calling `abortController?.abort()`. This
  prevents pile-up during rapid online/offline flapping.
- **Immediate on event, not just interval**: When `navigator.onLine` flips
  from `false` to `true`, the health check fires immediately (via the
  `useEffect` on `rawOnline`), not on the next 10s tick. This shortens the
  window during which the UI thinks it's online and attempts live fetches.
- **Pessimistic offline**: When `navigator.onLine` flips to `false`,
  `isOnline` goes `false` instantly with no health check needed.

The amber offline banner is controlled by `isOnline` — appears when
`!isOnline`, hidden when `isOnline`.

---

## Testing

### Using the Debug Page (`/debug-offline`)
1. Navigate to `/debug-offline`.
2. **Network & Storage**: Shows `isOnline` state and persistent storage grant.
3. **Queue Viewer**: Click "Refresh" to see pending items.
4. **Inject Dummy Analysis**: Creates a 200×200 gradient canvas, compresses
   to WebP, enqueues to IndexedDB.
5. **Trigger Sync**: Registers a Background Sync event (or shows fallback
   message on non-Chromium).
6. **Service Worker Status**: Shows registration/active flags.
7. **Event Log**: Timestamped console of all actions.

### ⚠ Critical: Test Against Production Build Only

Offline mode MUST be tested against a **production build** (`npm run build`
→ `npm run start`). Testing in `npm run dev` will NOT work for offline
navigation because:

1. **HMR rewrites the SW file** on every file edit, causing constant
   re-installation that interferes with caching.
2. **Dev mode skips Serwist** (`disable: process.env.NODE_ENV !== "production"`),
   so the dev-mode `public/sw.js` is used, which lacks proper RSC handling
   and `clientsClaim`.
3. **Turbopack** does not emit RSC headers in the same way as the production
   server.

### Full Offline Test Flow (Production Only)

1. Build and start: `npm run build && npm run start`.
2. Open Chrome, navigate to `http://localhost:3000`.
3. Open DevTools → Application → Service Workers. Confirm the SW is
   registered and active.
4. Log in. Wait 2–3 seconds (SW caches all pages via `cacheAllPages()`).
5. Go offline (DevTools → Network → Offline).
6. Click any sidebar link — should load page from cache immediately
   (served from `pages-rsc` cache for RSC payload, or from `shasthyahub-nav-v2`
   for full HTML fallback).
7. Navigate between all pages — each should load from cache.
8. Go to `/debug-offline`, inject a dummy analysis.
9. Check IndexedDB in Application tab for the queued item.
10. Go online, trigger sync — item should be processed.

### RSC Cache Hit Consistency Test

This stress-test verifies that RSC cache hits don't degrade after repeated
navigations (a known gotcha where the `_rsc` query param varies per request
and fragments the cache).

1. Build and start: `npm run build && npm run start`.
2. Log in, wait for cache warming (~3-5s).
3. Go offline (DevTools → Network → Offline).
4. **Repeated navigation test**: Click between **Nayan AI** and **ScriptGuard**
   (sidebar links) 5-6 times in a row. Each click should load the destination
   page fully from cache. If any click shows a blank/loading state, the RSC
   cache key normalization (`stripRsc()`) is not covering all varying params.
5. **Stale cache test**: Stay offline for 2-3 minutes without touching the
   page. Then click a link again — the page should still load from cache
   (provided `maxAgeSeconds` on the RSC caches hasn't expired, which is set
   to 60 minutes).
6. If either test fails, inspect the `_rsc` value in the failed request
   URL (DevTools → Network tab, look for `_rsc=` in the query string of
   failed fetches). Add any new varying params to `stripRsc()` in
   `public/sw.js`. Repeat from step 1.

---

## Live Data Fallback (Fix 7)

Dynamic data fetches (API calls, Supabase queries) are **not cached** by
the SW — they must always hit the network. When offline, these calls would
previously hang indefinitely.

### Fix Applied

- **Dashboard Home** (`app/(dashboard)/page.tsx`): `useQuery` health score
  fetch uses an `AbortController` with **8-second timeout**. On timeout or
  error, React Query's `isError` path shows the existing "Get Your First
  Score" fallback. `refetchInterval` pauses when `isOnline` is `false`.
- **Reports Page** (`app/(dashboard)/reports/page.tsx`): `fetchReports()`
  checks `useNetworkStatus()` before fetching. If offline, it sets an
  explicit error message ("You are offline — live data unavailable").
  Uses an `AbortController` with **8-second timeout** to fail fast on
  slow connections. An offline-specific UI state shows the `WifiOff` icon
  with a clear "You are offline" message.
- **All other data-fetching components** (history hooks, analysis hooks,
  doctor search): These are user-gesture-triggered (upload, search) or
  exist on pages behind auth. They benefit from the faster offline
  detection (Fix 6) which shortens the hang time from ~60s to ~5s. Full
  offline-awareness for every widget is deferred to Phase 1.

---

## Known Limitations

| Issue | Status |
|---|---|---|
| Background Sync is Chromium-only | iOS/Safari falls back to `online` event listener (Phase 1+). |
| No automatic re-submit on online event (client-side) | Phase 1 implements the `window.addEventListener('online')` fallback. |
| Dev-mode SW uses raw IndexedDB (not `idb`) | Serwist bundles `idb` for production. Dev SW uses raw APIs to avoid ESM import issues. |
| Supabase migration not auto-applied | Run `002_add_analysis_mode.sql` manually against your Supabase instance. |
| Offline testing must use production build | `npm run dev` causes HMR-triggered SW re-install → cache loss. Run `npm run build && npm run start`. |
| `_rsc` param normalization may need tuning | The `stripRsc()` helper strips `_rsc` from cache keys. If Next.js introduces additional cache-busting params, they must be added to this helper. Monitor during testing. |

---

## Dependencies Added

```json
"idb": "^8.0.2"
```

---

## Commands

```bash
npm run dev         # Dev server (SW registers from public/sw.js)
npm run build       # Production build (Serwist compiles app/sw.ts → public/sw.js)
npm run start       # Production server (SW active with all features)
npm run type-check  # TypeScript check (app/sw.ts excluded)
npm run lint        # ESLint
```
