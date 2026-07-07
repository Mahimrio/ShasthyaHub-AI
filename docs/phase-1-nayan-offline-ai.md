# Phase 1 — Nayan AI: On-Device Model (TensorFlow.js)

## Overview

Phase 1 integrates an offline TensorFlow.js model for diabetic retinopathy screening into Nayan AI. When the user is offline, the browser runs a quantized 3-class CNN (Normal / Refer / Urgent) directly via WebGL/WebGPU/WASM, eliminating the dependency on the remote Gemini→Groq pipeline. When the user regains connectivity, the preliminary offline result is automatically upgraded by re-submitting the image to the full online API.

The model files (`model.json` + `.bin` shards) live at `public/models/nayan-ai/` and are **not included at prompt-run time** — training/conversion is done separately in Python/Colab. The integration handles the missing-files case as a first-class, non-crashing state.

---

## Architecture Decisions

| Decision | Rationale |
|---|---|
| **Module-level singleton outside React** | The `loadModel()` in-flight Promise is stored at module scope, not inside a `useEffect` or component. Next.js 16 runs React 19 StrictMode, which double-mounts in dev. A React-local state would allocate the model twice and crash the tab. A module singleton means concurrent calls await the same load. |
| **Backend fallback chain: WebGPU → WebGL → WASM** | WebGPU is fastest but only available in Chromium 113+. WebGL is universally supported. WASM is the last resort — slower but functional. The selected backend is logged in dev mode via `[NayanTF]` prefix. |
| **`'missing'` ≠ `'unsupported'`** | Two distinct failure states. `'missing'` means the model files returned 404 (model training/conversion hasn't happened yet). `'unsupported'` means the hardware can't run TF.js at all. The UI shows different messages for each — a developer hitting `'missing'` needs a different signal than an end user on old hardware. |
| **Warm-up inference after load** | The first WebGL/WebGPU inference triggers shader compilation, which freezes the main thread for ~1-2s. Immediately after loading, the module runs a throwaway `tf.zeros([1, 224, 224, 3])` prediction and disposes the output. This pre-compiles shaders invisibly so the first user inference is instant. |
| **`requestIdleCallback` for model prefetch** | The SW prefetches `/models/nayan-ai/model.json` into `shasthyahub-models-v1` cache during idle time after activation. Uses `requestIdleCallback` with a 10s `setTimeout` fallback. If the files don't exist yet (404), it silently fails — zero noise in logs. |
| **Pessimistic offline model status polling** | The hook polls `getModelStatus()` every 2s via a `setInterval`. This catches late-load completion (model was `'loading'` → becomes `'ready'`) and updates the UI without the user needing to re-trigger anything. |
| **Auto-upgrade on reconnect** | When `isOnline` flips back to `true` and a prior offline result exists, the hook automatically POSTs the original image to `/api/nayan/analyze`. On success, the displayed result is replaced with the online version and `analysis_mode` updates to `'online'` in the UI. |

---

## Files Created / Modified

### New Files

#### `lib/ai/tensorflow-nayan.ts`
Core TF.js module — the only file that directly imports `@tensorflow/tfjs`.

- **Module-level singleton**: `modelPromise` and `model` are module-scoped `let` variables (not exported). The auto-load at the bottom (`if (typeof window !== 'undefined') { loadModel() }`) starts loading as soon as the module is first imported.
- **Backend selection**: `selectBackend()` tries `webgpu` → `webgl` → `wasm` in a try/catch chain. If all fail, sets status to `'unsupported'`.
- **Status getter**: `getModelStatus(): NayanModelStatus` — synchronous, returns `'unloaded' | 'loading' | 'ready' | 'unsupported' | 'missing'`.
- **Inference**: `analyzeEyeImageOffline(imageElement: HTMLImageElement)` — converts the image to a tensor (resize 224×224, normalize `/255`), runs `model.predict()`, finds argmax, returns `{ severity, confidence, mode: 'offline' }`.
- **Shape check (dev-only)**: Logs the model's expected input shape vs the actual image dimensions before inference — a silent shape mismatch is one of the most common TF.js integration bugs and produces plausible wrong results, so this is made loud in development.
- **Tensor lifecycle**: Inference wrapped in `tf.tidy()`. The raw input tensor built outside `tf.tidy()` is explicitly `.dispose()`'d in the `finally` block.
- **Severity strings**: Three buckets (`normal`, `refer`, `urgent`) each with Bengali and English explanation strings that match EyeResultCard's existing severity styling.
- **Input shape**: Hardcoded as `[1, 224, 224, 3]` (MobileNetV2/EfficientNet-lite0 default). Update this constant if your converted model uses a different shape.
- **Warm-up**: After `tf.loadGraphModel()`, runs `tf.zeros(INPUT_SHAPE)` through the model and disposes the result — pre-compiles shaders.

#### `docs/phase-1-nayan-offline-ai.md` *(this file)*

### Modified Files

#### `types/index.ts`
Added to `NayanResult`:
```ts
analysis_mode?: 'online' | 'offline'
```
Allows downstream consumers (EyeResultCard, history) to distinguish offline results.

#### `hooks/useNayanAnalysis.ts`
Rewritten from a simple one-shot POST hook to a dual-mode (online/offline) analysis router.

**Return type additions:**
- `analysisMode: 'online' | 'offline' | null` — which pipeline produced the current result.
- `offlineModelStatus: NayanModelStatus` — TF.js model state (for UI fallback rendering).
- `isUpgrading: boolean` — true while an offline result is being upgraded to online.

**Flow:**
1. `analyze(file)` is called.
2. Checks `isOnline` (from `useNetworkStatus()`):
   - **Online**: POST to `/api/nayan/analyze` (original behavior), tag `analysis_mode: 'online'`.
   - **Offline + model 'ready'**: Convert `File` → `HTMLImageElement` → call `analyzeEyeImageOffline()` → map 3-bucket result to `NayanResult` shape → store via `enqueueAnalysis()` (IndexedDB) → display with `analysis_mode: 'offline'`.
   - **Offline + model 'missing'/'unsupported'/'loading'**: Set appropriate error string — analysis won't proceed.
3. On reconnect (`isOnline` flips `false → true`): automatically POST the original image + local result to `/api/nayan/analyze`. On success, replace displayed result with online version.

**`mapOfflineResult()`** — Maps the 3-bucket offline output to the full `NayanResult` shape:
- `normal` → `Severity.Normal`, routine follow-up steps
- `refer` → `Severity.Medium`, consult within 30 days
- `urgent` → `Severity.High`, seek immediate care

#### `app/(dashboard)/nayan-ai/page.tsx`
- Added `useNetworkStatus()` for offline detection.
- Destructures new hook fields: `analysisMode`, `offlineModelStatus`, `isUpgrading`.
- Three pre-analysis fallback UI states in the image upload area:
  1. **'missing' fallback**: Amber card with download icon — "Offline analysis is not set up on this device yet — connect to the internet."
  2. **'unsupported' fallback**: Gray card with CPU icon — "Offline AI is not supported on this device — please connect to the internet."
  3. **Generic offline banner**: Thin amber bar — "Offline — results will be preliminary" (shown when model is ready or still loading).
- "Analyze Now" button is disabled when offline + missing/unsupported.
- Passes `analysisMode` and `isUpgrading` to `EyeResultCard`.

#### `components/features/nayan-ai/EyeResultCard.tsx`
- New props: `analysisMode?: 'online' | 'offline' | null`, `isUpgrading?: boolean`.
- Shows `AnalysisModeBadge` (green/amber pill) from Phase 0 when `analysisMode` is set.
- When `analysisMode === 'offline' && isUpgrading`: shows a spinning `RefreshCw` icon next to the badge with "Confirming with full analysis..." text.
- When `analysisMode === 'offline' && isUpgrading`: shows a full-width amber banner: "This is a preliminary offline read — confirming with full analysis..." with a `Loader2` spinner.

#### `public/sw.js`
Three changes:

1. **New cache constant** (`MODELS_CACHE = 'shasthyahub-models-v1'`) — independently versionable, won't invalidate page/RSC caches when bumped.

2. **Fetch handler for `/models/`** — cache-first strategy placed before the static-assets handler. Checks `shasthyahub-models-v1` first; on miss, fetches from network and stores a clone.

3. **Idle-time prefetch** — Added to the existing `activate` handler's `event.waitUntil` chain (after `cacheAllPages()`):
   ```js
   if ('requestIdleCallback' in self) {
     self.requestIdleCallback(doPrefetch, { timeout: 10000 })
   } else {
     setTimeout(doPrefetch, 5000)
   }
   ```
   The prefetch fetches `/models/nayan-ai/model.json`. If it returns 404 (model not yet added), it fails silently — no logged error, no breakage.
   
4. **Cache cleanup filter** — `MODELS_CACHE` added to the exclusion list in `activate` so it survives cache purges.

5. **NOT added to precache** — model files are only cached lazily via the fetch handler or the idle-time prefetch. Never blocks SW install.

#### `package.json`
Added: `"@tensorflow/tfjs": "^x.y.z"` (installed at time of writing).

---

## Service Worker: New Cache

| Cache Name | Contents | Strategy |
|---|---|---|
| `shasthyahub-models-v1` | `/models/nayan-ai/model.json`, `.bin` shards | Cache-first — model files are static until retrained. Once cached, always served from cache. No network after first load. |

**Cache warming**: The model files are NOT pre-cached at install time. They are cached lazily:
1. First time user visits Nayan AI page online → fetch handler stores in `shasthyahub-models-v1`.
2. On SW activate → `requestIdleCallback` fetches `model.json` in the background, warming the cache without blocking anything.

---

## Offline Analysis Flow

```
User uploads image (offline)
    │
    ├── getModelStatus() === 'ready'?
    │   Yes → 1. Convert File → HTMLImageElement
    │          2. analyzeEyeImageOffline() → { severity, confidence }
    │          3. mapOfflineResult() → NayanResult (analysis_mode: 'offline')
    │          4. enqueueAnalysis() → IndexedDB (for Background Sync)
    │          5. Display result with AnalysisModeBadge("Preliminary · Offline")
    │
    ├── getModelStatus() === 'missing'?
    │   → Show amber "not set up" card — disable analyze button
    │
    ├── getModelStatus() === 'unsupported'?
    │   → Show gray "not supported" card — disable analyze button
    │
    └── getModelStatus() === 'loading'?
        → Show amber "offline" bar — allow analyze (it will wait for model)

         ...
    Network reconnects
         │
         └── isOnline flips to true + lastOfflineFileRef exists
              → POST to /api/nayan/analyze with original image + localResult
              → On success: replace displayed result, update analysis_mode to 'online'
              → UI shows AnalysisModeBadge("Verified · Online")
```

---

## 3-Bucket Classification Mapping

| Offline output | `NayanResult.severity` | Urgency days | Specialist |
|---|---|---|---|
| `normal` | `Normal` | 365 | General Ophthalmologist |
| `refer` | `Medium` | 30 | Retina Specialist |
| `urgent` | `High` | 7 | Retina Specialist |

---

## Network Detection Integration

The offline AI feature depends on `useNetworkStatus()` (Phase 0) which uses a pessimistic detection strategy:
- `navigator.onLine = false` → offline instantly
- `navigator.onLine = true` → requires a confirmed `HEAD /api/health` response before declaring online
- Health check every 10s, AbortController cancels stale checks

The hook also polls `getModelStatus()` every 2s to catch late-load transitions.

---

## Testing

### ⚠ Critical: Test Against Production Build Only

Offline TF.js inference MUST be tested against a **production build** (`npm run build` → `npm run start`). Testing in `npm run dev` will NOT work reliably because:
1. HMR rewrites `public/sw.js` on every edit, causing constant SW re-installation.
2. The TF.js module's dev-only logs are visible in dev mode but actual end-to-end offline behavior may differ.
3. Shader compilation timing differs between dev and production modes.

### Verification Checklist

1. **`npm run build`** — confirms no Turbopack/TF.js bundling errors.
2. **Zero model files present** (`public/models/nayan-ai/` doesn't exist or is empty):
   - App loads normally online with no console errors.
   - Going offline shows the amber "not set up yet" card (not `'unsupported'`).
   - Analyze button is disabled.
3. **With real or placeholder model files**:
   - `npm run build && npm run start`
   - Go offline, submit an eye image, confirm a labeled "Preliminary" result appears within ~1-2s.
   - Confirm in DevTools → Application → Cache Storage that `shasthyahub-models-v1` contains the model files.
   - Check the console for the dev-only log: `[NayanTF] Backend selected: <webgpu|webgl|wasm>`.
   - Go back online — confirm the "Preliminary" badge upgrades to "Verified · Online" automatically.
4. **Backend fallback**: On a device without WebGPU (e.g. Safari, older Firefox), confirm WebGL is logged. On a device with neither WebGL nor WebGPU (rare), confirm WASM is logged and results still appear.

---

## Dependencies Added

```json
"@tensorflow/tfjs": "^4.22.0"
```

---

## Build Verification

- `npm run build` passes — Turbopack bundles TF.js without WASM asset resolution issues.
- `npm run type-check` passes — zero TypeScript errors.
- `npm run lint` passes — zero ESLint errors/warnings.

---

## Known Limitations

| Issue | Status |
|---|---|
| Offline model not yet trained/converted | Phase 1a — do outside opencode in Python/Colab. Place output at `public/models/nayan-ai/`. |
| Only Nayan AI agent has TF.js offline mode | ScriptGuard and GlycoVision still require network. Phase 2+ will add their offline models. |
| `crypto.randomUUID()` for offline result IDs | Works in all modern browsers. Falls back to hook-level error on very old browsers. |
| No automatic re-fetch of updated results | After SW sync marks an item as `synced`, the page does not automatically re-query the server. The `isOnline` reconnect effect handles the upgrade only for the most recent analysis during the same page session. |
| RequestIdleCallback not available in all browsers | `setTimeout` fallback at 5s covers Safari and older browsers. |
