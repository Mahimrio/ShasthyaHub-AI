# Phase 2 — ScriptGuard Offline OCR

## Goal

Enable ScriptGuard (prescription analysis) to run fully offline using Tesseract.js for OCR (Optical Character Recognition), with drug-name fuzzy matching via Fuse.js, interaction checking, and a post-back sync queue. No network required for the OCR step after initial file download.

---

## Files Created / Modified

### New files

| File | Purpose |
|------|---------|
| `lib/ai/tesseract-scriptguard.ts` | Main-thread bridge to Tesseract.js `createWorker`. Singleton worker with 3-state status (`ready`/`missing`/`unsupported`). Exports `getOcrStatus()`, `checkOcrAvailability()`, `extractPrescriptionTextOffline()`. |
| `lib/services/parse-ocr-to-meds.ts` | Fuse.js-based fuzzy matcher. Builds a search index once at module load from `drug-mapping.ts` (37 brand→generic entries). Extracts drug names, dosage, frequency, duration from raw OCR text line by line. Returns `ExtractedMedication[]`. |
| `docs/phase-2-scriptguard-offline-ocr.md` | This document. |

### Modified files

| File | What changed |
|------|-------------|
| `hooks/useScriptGuardAnalysis.ts` | Rewrote from `useState` to `useReducer`. Added `offlineStatus` (`idle`/`missing`/`unsupported`/`ready`). Ref-based `isOnline`/`offlineStatus` to avoid stale closures (moved ref sync into `useEffect` per React 19 lint rules). Direct `navigator.onLine` check in `analyze()` callback. Catches `TypeError` (network failure) and falls back to `runOfflineAnalysis()`. |
| `components/features/scriptguard/ExtractedMedsTable.tsx` | Per-row OCR badge when `mode='offline'`. |
| `components/features/scriptguard/AudioGuide.tsx` | Disabled play button + tooltip when no Bengali voice available (`window.speechSynthesis`, not cloud TTS). |
| `public/sw.js` | Added `shasthyahub-ocr-v3` cache. Cache-first rule for `/tesseract-lang/*`. Idle prefetch of all OCR files at activation (logs failures instead of silent `.catch`). |
| `app/layout.tsx` | Removed `next/font/google` import (blocked offline builds). |
| `app/globals.css` | Replaced `next/font/google` variables with pure CSS system-font stacks for Bangla/English. |
| `eslint.config.mjs` | Added `public/tesseract-lang/**` to global ignores (vendored third-party minified files). |
| `scripts/audit-nayan.mjs` | Renamed unused `statusMatch` → `_statusMatch`. |

### Deleted files

| File | Reason |
|------|--------|
| `workers/tesseract.worker.ts` | Previously wrapped Tesseract.js inside a custom Web Worker. Caused `importScripts('undefined')` because Turbopack's blob-worker compilation couldn't resolve Tesseract.js's internal `workerPath`/`corePath`. Replaced by direct main-thread usage (Tesseract.js v5 manages its own internal workers). |
| `workers/` (directory) | Empty after removal. |

### Self-hosted files in `public/tesseract-lang/` (downloaded from jsDelivr)

| File | Size | Source |
|------|------|--------|
| `eng.traineddata` | 4.1 MB | Tesseract English language pack |
| `ben.traineddata` | 856 KB | Tesseract Bengali language pack |
| `tesseract-core.wasm.js` | 4.7 MB | WASM core wrapper (no-SIMD fallback, not selected with oem=1) |
| `tesseract-core.wasm` | 3.4 MB | Raw WASM binary (no-SIMD fallback) |
| `tesseract-core-lstm.wasm.js` | 3.9 MB | LSTM-only WASM core wrapper (selected when !SIMD + lstmOnly) |
| `tesseract-core-lstm.wasm` | 2.8 MB | LSTM-only raw WASM binary |
| `tesseract-core-simd-lstm.wasm.js` | 3.9 MB | SIMD+LSTM WASM core wrapper (selected when SIMD + lstmOnly) |
| `tesseract-core-simd-lstm.wasm` | 2.9 MB | SIMD+LSTM raw WASM binary |
| `tesseract-worker.min.js` | 124 KB | Tesseract.js standalone worker script (from `node_modules/tesseract.js/dist/worker.min.js`) |

**Core selection logic** (from `node_modules/tesseract.js/src/worker-script/browser/getCore.js`):

| SIMD? | lstmOnly? | File loaded |
|-------|-----------|-------------|
| Yes | Yes | `tesseract-core-simd-lstm.wasm.js` |
| Yes | No | `tesseract-core-simd.wasm.js` (not needed — oem=1 always) |
| No | Yes | `tesseract-core-lstm.wasm.js` |
| No | No | `tesseract-core.wasm.js` (not needed — oem=1 always) |

---

## Architecture

### Data flow when offline

```
User selects image
        │
        ▼
useScriptGuardAnalysis.analyze(file)
        │
        ├─ check navigator.onLine ──false──► runOfflineAnalysis(file)
        │                                         │
        │                                         ▼
        │                              extractPrescriptionTextOffline(file)
        │                                         │
        │                                         ▼
        │                              tesseract-scriptguard (singleton)
        │                                └─ createWorker(['eng','ben'], 1, {
        │                                     langPath: '/tesseract-lang',
        │                                     cachePath: '/tesseract-lang',
        │                                     corePath: '/tesseract-lang',
        │                                     workerPath: '/tesseract-lang/tesseract-worker.min.js'
        │                                   })
        │                                         │
        │                                         ▼
        │                              Tesseract.js creates internal Web Worker
        │                                └─ new Worker(workerPath)  OR
        │                                   blob-wrapper → importScripts(workerPath)
        │                                         │
        │                                         ▼
        │                              Worker loads WASM core via importScripts(corePath + '/tesseract-core.wasm.js')
        │                                         │
        │                                         ▼
        │                              Worker fetches {eng,ben}.traineddata via langPath
        │                                         │
        │                                         ▼
        │                              recognize(imageBlob) → { data.text, data.confidence }
        │                                         │
        │                                         ▼
        │                              parseOcrToMeds(rawText, confidence)
        │                                └─ Fuse.js fuzzy match against drugMapping
        │                                         │
        │                                         ▼
        │                              checkDrugInteractions(genericNames)
        │                                └─ 28 interactions from drug-interaction.ts
        │                                         │
        │                                         ▼
        │                              Build ScriptGuardResult (offline schema)
        │                                ├─ extracted_drugs (ExtractedMedication[])
        │                                ├─ interaction_warnings (DrugInteraction[])
        │                                ├─ gemini_raw.raw_text = OCR output
        │                                └─ gemini_raw.medications = parsed meds
        │                                         │
        │                                         ▼
        │                              enqueueAnalysis('scriptguard', file, result)
        │                                └─ IndexedDB queue (for background sync when online)
        │
        └─ (online path) ──► POST /api/scriptguard/analyze
                                │
                                └─ TypeError (network drops mid-flight)
                                    └─ fall back to runOfflineAnalysis(file)
```

### State machine for offline OCR

```
                        initWorker()
                            │
                            ▼
                     ┌─ unloaded ──► loading
                     │                   │
                     │            ┌──────┴──────┐
                     │            │             │
                     │         success        error
                     │            │             │
                     │            ▼             ▼
                     │          ready     ┌─────┴──────┐
                     │                    │            │
                     │                 404/traineddata  other
                     │                    │            │
                     │                    ▼            ▼
                     │                 missing    unsupported
                     │                    │            │
                     └────────────────────┴────────────┘
                          (retry on next call)
```

### Error classification

| Error pattern | Status | User message |
|--------------|--------|-------------|
| `404`, `traineddata`, `Failed to fetch`, `Network error` | `missing` | "Offline OCR isn't set up on this device yet — connect to the internet for analysis." |
| WASM init failure, `importScripts` failure | `unsupported` | "Offline AI isn't supported on this device — please connect to the internet for analysis." |

---

## Key files in detail

### `lib/ai/tesseract-scriptguard.ts` — OCR bridge

- Module-level singleton: stores `status`, `worker`, `workerPromise`.
- `initWorker()`: guarded — only one init attempt at a time.
- Options passed to `createWorker`
- `checkOcrAvailability()`: calls `initWorker()`, returns current status.
- `extractPrescriptionTextOffline(imageBlob)`: awaits `initWorker()`, calls `worker.recognize()`, returns `{ rawText, confidence, mode: 'offline' }`.

```ts
const w = await createWorker(
  ['eng', 'ben'],
  1,
  {
    langPath: LANG_PATH,       // '/tesseract-lang'
    cachePath: LANG_PATH,      // '/tesseract-lang'
    corePath: LANG_PATH,       // '/tesseract-lang'
    workerPath: `${LANG_PATH}/tesseract-worker.min.js`,
  }
)
```

### `lib/services/parse-ocr-to-meds.ts` — OCR → structured medications

- Fuse.js index built at module load (singleton pattern).
- Lines are cleaned, words filtered against `COMMON_NON_DRUGS` set + numeric/regex filters.
- Drug name = first `MAX_DRUG_WORDS` (5) words from each line.
- Regex extracted: dosage (`\d+ (mg|ml|gm|mcg|iu)`), frequency (`\d+ (times|বার) (daily|দিনে|...)`), duration (`for (\d+) (days|দিন|weeks|সপ্তাহ)`).
- Fuse.js threshold: 0.4, distance: 100, minMatchCharLength: 3.
- Keys: `brand` (weight 0.7), `generic` (weight 0.3).
- Static class map: 25+ drug→class mappings (Analgesic, PPI, NSAID, Statin, etc.).
- Confidence tiers: `high` (exact match), `medium` (fuzzy < 0.4), `low` (no match).

### `hooks/useScriptGuardAnalysis.ts` — React hook

- `useReducer` with 6 action types: `START_LOADING`, `SET_RESULT`, `SET_ERROR`, `SET_MODE`, `SET_OFFLINE_STATUS`, `RESET`.
- Ref syncing for stale-closure prevention:
  ```ts
  useEffect(() => { isOnlineRef.current = isOnline }, [isOnline])
  useEffect(() => { statusRef.current = state.offlineStatus }, [state.offlineStatus])
  ```
- `analyze()` callback:
  1. Reads `navigator.onLine` directly (not from ref).
  2. If offline → if status is usable, call `runOfflineAnalysis`; else show error.
  3. If online → `POST /api/scriptguard/analyze` with AbortController (60s timeout).
  4. If `TypeError` caught → fall back to `runOfflineAnalysis`.
- `runOfflineAnalysis(file)`:
  1. `extractPrescriptionTextOffline(file)`
  2. `parseOcrToMeds(ocrResult.rawText, ocrResult.confidence)`
  3. `checkDrugInteractions(genericNames)`
  4. Build `ScriptGuardResult` with offline schema
  5. `enqueueAnalysis('scriptguard', file, result)`

### `public/sw.js` — Service Worker

- Prefetches OCR files at activate:
  ```js
  '/tesseract-lang/eng.traineddata'
  '/tesseract-lang/ben.traineddata'
  '/tesseract-lang/tesseract-core.wasm.js'
  '/tesseract-lang/tesseract-core.wasm'
  '/tesseract-lang/tesseract-core-lstm.wasm.js'
  '/tesseract-lang/tesseract-core-lstm.wasm'
  '/tesseract-lang/tesseract-worker.min.js'
  ```
- Cache-first rule for `/tesseract-lang/*` via `OCR_CACHE`.

---

### Cache-versioning convention

The `OCR_CACHE` constant in `public/sw.js` must be **bumped** (e.g. `v2` → `v3`) whenever `OCR_FILES` is modified (files added, removed, or paths changed). The activate handler already deletes caches not in the allowlist, so a version bump guarantees the new activation runs a fresh prefetch and no stale entries from a previous deployment carry over.

Incremented versions: `shasthyahub-ocr-v1` → `v2` (SIMD-lstm fix) → `v3` (worker.min.js stale-cache fix).  
Do NOT reuse a version number — even if the old cache was deleted, a reused version causes confusion when inspecting `CacheStorage` in DevTools.

## Build & tooling

All commands pass cleanly:

```
npm run type-check   ✔  (tsc --noEmit, 0 errors)
npm run lint        ✔  (0 errors, 0 warnings)
npm run build       ✔  (Next.js 16 Turbopack, 20 pages static)
```

### Gotchas encountered

1. **`next/font/google` blocks offline builds** → Replaced with CSS system-font stacks.
2. **React 19 lint rule: no ref writes during render** → Moved `ref.current = x` into `useEffect`.
3. **ESLint 9 `eslint.config.mjs`** — Uses `globalIgnores()` from `"eslint/config"`.
4. **Vendored third-party files** (`public/tesseract-lang/*.min.js`) — Must be in eslint ignores.
5. **Supabase client required dynamic import** (see `AGENTS.md` "Critical" section).
6. **`ERR_INTERNET_DISCONNECTED` is unavoidable** — browser logs failed fetches. The fix is catching `TypeError` and falling back to offline pipeline.

---

## Persistent problems (NEED CLAUDE'S HELP)

### Problem 1: `importScripts('undefined')` (CRITICAL — BLOCKING)

**Console error:**
```
f8e875e2-45fe-4ae0-b333-bee6e0d15e7c:1 Uncaught SyntaxError:
  Failed to execute 'importScripts' on 'WorkerGlobalScope':
  The URL 'undefined' is invalid.
```

**This happens even after the rewrite** (using `createWorker` from main thread, not nested in our own Worker). The blob URL changes each page load (`1c56b658-...` → `f8e875e2-...`) but the error is identical.

#### What we know

**Our call site** (`lib/ai/tesseract-scriptguard.ts`):
```ts
const w = await createWorker(['eng', 'ben'], 1, {
  langPath: '/tesseract-lang',
  cachePath: '/tesseract-lang',
  corePath: '/tesseract-lang',
  workerPath: '/tesseract-lang/tesseract-worker.min.js',
})
```

**Tesseract.js source (v5.1.1)** — the flow:

1. `src/createWorker.js:46` → `spawnWorker(options)` where `options` = merged defaults + user options
2. `src/worker/browser/spawnWorker.js`:
   ```js
   module.exports = ({ workerPath, workerBlobURL }) => {
     if (Blob && URL && workerBlobURL) {
       const blob = new Blob([`importScripts("${workerPath}");`], ...);
       worker = new Worker(URL.createObjectURL(blob));
     } else {
       worker = new Worker(workerPath);
     }
   };
   ```
3. `src/constants/defaultOptions.js`:
   ```js
   module.exports = {
     workerBlobURL: true,   // ← DEFAULT IS TRUE
     logger: () => {},
   };
   ```
4. So with `workerBlobURL: true` AND `workerPath` set, the blob wrapper is `importScripts(workerPath)`.
5. Inside the wrapper blob → `worker.min.js` runs → `getCore.js`:
   ```js
   const corePathImport = corePath || `https://cdn.jsdelivr.net/npm/tesseract.js-core@v${version}`;
   global.importScripts(corePathImportFile);
   ```
6. `corePath` is sent from the main thread via `loadInternal`:
   ```js
   // src/createWorker.js:81
   const loadInternal = (jobId) => (
     startJob(createJob({
       id: jobId, action: 'load',
       payload: { options: { lstmOnly, corePath: options.corePath, logging: options.logging } },
     }))
   );
   ```

#### Key observation

The error is at **line 1, column 1** of a **blob URL**. This means the blob itself is only one line: `importScripts(undefined)`. This happens when `workerPath` is `undefined` at the time the blob template literal is evaluated.

But `workerPath` is set in our options, merged with defaults, AND resolved to an absolute URL by `resolvePaths.js`. It SHOULD be a string.

#### Theories

1. **`workerBlobURL: true` default** — Setting `workerBlobURL: true` means the worker is always wrapped in a blob. Maybe setting this to `false` in our options would fix it (bypassing the blob wrapper entirely and using `new Worker(workerPath)` directly). Try: `workerBlobURL: false` in the options passed to `createWorker`.

2. **Source vs. bundled code mismatch** — Next.js Turbopack bundles from `src/` (using the `browser` field in package.json). But maybe Turbopack resolves the code differently than expected. The error could be from a different code path in the bundled output.

3. **Race condition in init** — Maybe `createWorker` is called multiple times (from `checkOcrAvailability()` and then `extractPrescriptionTextOffline()`) before the first call completes, causing the options to be lost.

4. **`cachePath` overrides something** — We pass `cachePath: '/tesseract-lang'`. Looking at the source, `cachePath` is used in the worker script for caching `.traineddata` files via IndexedDB. It shouldn't affect `workerPath`. But maybe it's being confused internally.

#### Possible fix to try

Add `workerBlobURL: false` to the options:
```ts
const w = await createWorker(['eng', 'ben'], 1, {
  langPath: LANG_PATH,
  cachePath: LANG_PATH,
  corePath: LANG_PATH,
  workerPath: `${LANG_PATH}/tesseract-worker.min.js`,
  workerBlobURL: false,   // ← ADD THIS
})
```

### Problem 2: `turbopack-worker-*.js:1 Uncaught null`

```
turbopack-worker-2gqdcwp7k90ea.js:1 Uncaught null
```

This looks like a Turbopack runtime error in one of its internal workers (hot reloading / HMR). It's unrelated to Tesseract.js but clutters the console. Likely a Turbopack bug / dev-mode artifact.

### Problem 3: Supabase `ERR_INTERNET_DISCONNECTED` (expected)

```
GET https://jdpfztijnkyzfvyofgri.supabase.co/rest/v1/profiles?select=*&id=eq.51451f3c-85e6-4327-bed2-a5eaa39773b2
net::ERR_INTERNET_DISCONNECTED
```

This is from the `useAuth` hook or a profile fetch that runs on mount. When offline, the Supabase client fails with this error. This is expected behavior — the app should degrade gracefully. Currently it's ignored (caught by the promise chain). Not a blocking issue but should ideally be suppressed or handled with a graceful message.

### Problem 4: Self-hosted core WASM loading

Even if the `importScripts('undefined')` bug is fixed, the WASM core must load correctly. The file chain:

1. `tesseract-core.wasm.js` is a JS wrapper that `importScripts` the WASM binary
2. The WASM binary (`tesseract-core.wasm`) is loaded by the wrapper

Both files exist in `public/tesseract-lang/` and are cache-first in the SW. But the WASM file is 3.4 MB and the LSTM version is 2.8 MB. Loading via `importScripts` from the SW cache may have issues with MIME types or large binary transfer.

---

## Verification commands

```bash
cd ShasthyaHub-AI
npm run type-check   # tsc --noEmit (NOT just tsc)
npm run lint         # eslint.config.mjs (flat config)
npm run build        # Next.js production build (must use build, not dev)
npm run start        # Serve on http://localhost:3000
```

Testing offline: Disconnect network, then use `npm run build && npm run start`.

---

## Appendix: Tesseract.js v5.1.1 source structure (node_modules/tesseract.js/)

```
src/
├── index.js                          # Entry: re-exports createWorker etc.
├── createWorker.js                   # Main worker creation — merges options, spawns worker, sets up message passing
├── createScheduler.js
├── createJob.js
├── utils/
│   ├── resolvePaths.js               # Resolves corePath/workerPath/langPath to absolute URLs
│   ├── getEnvironment.js             # Detects: browser | node | webworker | electron
│   └── log.js
├── constants/
│   ├── defaultOptions.js             # { workerBlobURL: true, logger: () => {} }
│   ├── languages.js
│   ├── OEM.js
│   └── PSM.js
├── worker/
│   ├── node/ (replaced by browser/ via package.json "browser" field)
│   └── browser/
│       ├── index.js                  # Adapter exports
│       ├── defaultOptions.js         # { ...defaultOptions, workerPath: CDN_URL }
│       ├── spawnWorker.js            # Creates Worker from workerPath (with optional blob wrapper)
│       ├── terminateWorker.js
│       ├── onMessage.js
│       ├── send.js
│       └── loadImage.js
└── worker-script/
    ├── index.js                      # Main worker logic: load, recognize, FS, etc.
    ├── browser/
    │   ├── index.js                  # Registers message handler, sets adapter
    │   ├── getCore.js                # Computes core URL → global.importScripts(corePathImportFile)
    │   ├── gunzip.js
    │   └── cache.js
    ├── node/
    └── utils/
```
