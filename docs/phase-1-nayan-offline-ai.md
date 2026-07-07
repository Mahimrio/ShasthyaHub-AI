# Phase 1 — Nayan AI: On-Device Model (TensorFlow.js)

## Overview

Phase 1 integrates an offline TensorFlow.js model for diabetic retinopathy screening into Nayan AI. When the user is offline, the browser runs a quantized 3-class CNN (Normal / Refer / Urgent) directly via WebGL/WebGPU/WASM, eliminating the dependency on the remote Gemini→Groq pipeline. When the user regains connectivity, the preliminary offline result is automatically upgraded by re-submitting the image to the full online API.

The model files (`model.json` + `.bin` shards) live at `public/models/nayan-ai/` and are produced separately via the conversion pipeline documented in [Stage 1a](#stage-1a-model-training--conversion). The integration handles the missing-files case as a first-class, non-crashing state (`status = 'missing'`).

---

## Architecture Decisions

| Decision | Rationale |
|---|---|
| **Module-level singleton outside React** | The `loadModel()` in-flight Promise is stored at module scope, not inside a `useEffect` or component. Next.js 16 runs React 19 StrictMode, which double-mounts in dev. A React-local state would allocate the model twice and crash the tab. A module singleton means concurrent calls await the same load. |
| **Backend fallback chain: WebGPU → WebGL → WASM** | WebGPU is fastest but only available in Chromium 113+. WebGL is universally supported. WASM is the last resort — slower but functional. The selected backend is logged via `[NayanTF]` prefix. |
| **`'missing'` ≠ `'unsupported'`** | Two distinct failure states. `'missing'` means the model files returned 404 (model training/conversion hasn't happened yet). `'unsupported'` means the hardware can't run TF.js at all. The UI shows different messages for each. |
| **Warm-up inference after load** | The first WebGL/WebGPU inference triggers shader compilation, which freezes the main thread for ~1-2s. Immediately after loading, the module runs a throwaway `tf.zeros([1, 224, 224, 3])` prediction and disposes the output. This pre-compiles shaders invisibly so the first user inference is instant. |
| **SW prefetch inside `event.waitUntil`** | The SW prefetches both `model.json` and `group1-shard1of1.bin` into `shasthyahub-models-v1` cache during activation. The fetch runs immediately inside the `waitUntil` promise chain so the SW stays alive until both files are fully downloaded. No `setTimeout` or `requestIdleCallback` — those caused the SW to terminate before the bin file finished downloading. |
| **No HEAD pre-check before `loadLayersModel()`** | Earlier code did a HEAD request to verify model files existed. The SW only intercepts GET requests, so HEAD bypassed cache and failed when offline. Now `loadLayersModel()` runs directly; 404s are caught and mapped to `'missing'` status. |
| **`worker-src blob:` in CSP** | TF.js creates a Web Worker from a `blob:` URL. The Content-Security-Policy must explicitly allow this via `worker-src 'self' blob;` — otherwise Chrome logs a (non-blocking) CSP violation. |
| **Auto-upgrade on reconnect** | When `isOnline` flips back to `true` and a prior offline result exists, the hook automatically POSTs the original image to `/api/nayan/analyze`. On success, the displayed result is replaced with the online version and `analysis_mode` updates to `'online'` in the UI. |

---

## Files Created / Modified

### New Files

#### `lib/ai/tensorflow-nayan.ts`

Core TF.js module — the only file that directly imports `@tensorflow/tfjs`.

- **Module-level singleton**: `modelPromise` and `model` are module-scoped `let` variables (not exported). No eager auto-load (removed in debugging — it locked status to `'unsupported'` on import).
- **Backend selection**: `selectBackend()` tries `webgpu` → `webgl` → `wasm` in a try/catch chain. If all fail, sets status to `'unsupported'`.
- **Status getter**: `getModelStatus(): NayanModelStatus` — synchronous, returns `'unloaded' | 'loading' | 'ready' | 'unsupported' | 'missing'`.
- **On-demand loading**: `loadModel()` is called lazily by `analyzeEyeImageOffline()`. No eager boot — the module doesn't touch the network on import.
- **Direct `loadLayersModel()`**: No HEAD pre-check. Calls `tf.loadLayersModel(MODEL_URL)` directly. SW serves both `model.json` and `group1-shard1of1.bin` from cache.
- **Inference**: `analyzeEyeImageOffline(imageElement: HTMLImageElement)` — converts image to tensor (resize 224×224, normalize `/255`), runs `model.predict()`, finds argmax, returns `{ severity, confidence, mode: 'offline' }`.
- **Shape check**: Logs the model's expected input shape vs actual image dimensions before inference.
- **Tensor lifecycle**: Inference wrapped in `tf.tidy()`. The raw input tensor built outside `tf.tidy()` is explicitly `.dispose()`'d in the `finally` block.
- **Severity strings**: Three buckets (`normal`, `refer`, `urgent`) each with Bengali and English explanation strings.
- **Input shape**: Hardcoded as `[1, 224, 224, 3]` (MobileNetV2 default). Update this constant if your converted model uses a different shape.
- **Warm-up**: After `tf.loadLayersModel()`, runs `tf.zeros(INPUT_SHAPE)` through the model and disposes the result — pre-compiles shaders.
- **Logging**: Unconditional `console.log('[NayanTF]', ...)` — no `process.env.NODE_ENV` gate, so logs appear in production builds.

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
   - **Online**: POST to `/api/nayan/analyze`. On 429/quota/TypeError → auto-fallback to `runOffline(file)`.
   - **Offline**: Convert `File` → `HTMLImageElement` → call `analyzeEyeImageOffline()` → map 3-bucket result to `NayanResult` shape → display with `analysis_mode: 'offline'`.
3. On reconnect (`isOnline` flips `false → true`): automatically POST the original image + local result to `/api/nayan/analyze`. On success, replace displayed result with online version.

**`mapOfflineResult()`** — Maps the 3-bucket offline output to the full `NayanResult` shape:
- `normal` → `Severity.Normal`, routine follow-up steps
- `refer` → `Severity.Medium`, consult within 30 days
- `urgent` → `Severity.High`, seek immediate care

#### `app/(dashboard)/nayan-ai/page.tsx`

- Added `useNetworkStatus()` for offline detection.
- Destructures new hook fields: `analysisMode`, `offlineModelStatus`, `isUpgrading`.
- Three pre-analysis fallback UI states in the image upload area:
  1. **'missing' fallback**: Amber card — "Offline analysis is not set up on this device yet — connect to the internet."
  2. **'unsupported' fallback**: Gray card — "Offline AI is not supported on this device — please connect to the internet."
  3. **Generic offline banner**: Thin amber bar — "Offline — results will be preliminary" (shown when model is ready or still loading).
- "Analyze Now" button is disabled when offline + missing/unsupported.
- Passes `analysisMode` and `isUpgrading` to `EyeResultCard`.

#### `components/features/nayan-ai/EyeResultCard.tsx`

- New props: `analysisMode?: 'online' | 'offline' | null`, `isUpgrading?: boolean`.
- Shows `AnalysisModeBadge` (green/amber pill) when `analysisMode` is set.
- When `analysisMode === 'offline' && isUpgrading`: shows spinning `RefreshCw` icon + "Confirming with full analysis..." text + amber banner.

#### `public/sw.js`

Changes for model caching:

1. **Cache constant**: `MODELS_CACHE = 'shasthyahub-models-v1'` — independently versionable.
2. **Fetch handler for `/models/`**: Cache-first strategy placed before the static-assets handler. Checks `shasthyahub-models-v1` first; on miss, fetches from network and stores a clone.
3. **Activation prefetch**: Added to `activate` handler's `event.waitUntil` chain after `cacheAllPages()`. Fetches both `model.json` and `group1-shard1of1.bin` immediately (no setTimeout). Returns the `Promise.allSettled(...)` into the `waitUntil` chain so the SW stays alive until both files are cached.
4. **Cache cleanup filter**: `MODELS_CACHE` added to exclusion list in `activate` so it survives cache purges.
5. **NOT added to precache** — model files are cached lazily at activation, never at install.

#### `middleware.ts`

Added `worker-src 'self' blob;` to Content-Security-Policy header. Without this, TF.js worker creation from `blob:` URLs triggers a CSP violation.

#### `lib/ai/gemini.ts`

Fallback model changed from `gemini-1.5-flash` to `gemini-2.0-flash`. The v1beta API doesn't expose `gemini-1.5-flash` (returns 404).

#### `lib/rate-limit.ts`

`maxRequests` bumped from 10 to 100 in dev (10 in CI) to avoid hitting the rate limiter during testing.

#### `package.json`

Added: `"@tensorflow/tfjs": "^4.22.0"`.

---

## Service Worker: Model Cache

| Cache Name | Contents | Strategy |
|---|---|---|
| `shasthyahub-models-v1` | `/models/nayan-ai/model.json`, `group1-shard1of1.bin` | Cache-first — model files are static until retrained. |

**Cache warming**: During SW activation, both files are fetched inside `event.waitUntil` and stored in `shasthyahub-models-v1`. The SW stays alive until both downloads complete.

---

## Offline Analysis Flow

```
User uploads image (offline)
    │
    ├── navigator.onLine may still be true (10-30s lag on Windows/Chrome)
    │   → Online path attempted: POST /api/nayan/analyze
    │   → TypeError (ERR_INTERNET_DISCONNECTED) caught
    │   → Fallback to runOffline(file)
    │
    ├── runOffline(file)
    │    ├── analyzeEyeImageOffline(img)
    │    │    ├── loadModel()
    │    │    │    ├── selectBackend() → WebGPU → WebGL → WASM
    │    │    │    ├── tf.ready()
    │    │    │    ├── tf.loadLayersModel('/models/nayan-ai/model.json')
    │    │    │    │    └── SW intercepts → serves model.json from MODELS_CACHE
    │    │    │    │    └── TF.js parses weights → requests group1-shard1of1.bin
    │    │    │    │         └── SW intercepts → serves from MODELS_CACHE
    │    │    │    ├── warm-up inference (zeros)
    │    │    │    └── status = 'ready'
    │    │    ├── imageToTensor() → resize 224×224 → normalize [0,1]
    │    │    ├── model.predict() → logits
    │    │    └── argmax → { severity, confidence }
    │    └── mapOfflineResult() → NayanResult (analysis_mode: 'offline')
    │
    └── Display result with AnalysisModeBadge("Preliminary · Offline")

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

## Testing

### Test Against Production Build Only

Offline TF.js inference MUST be tested against a **production build** (`npm run build` → `npm run start`). Testing in `npm run dev` will NOT work reliably because:
1. HMR rewrites `public/sw.js` on every edit, causing constant SW re-installation.
2. The TF.js module's logs are visible in all modes but actual end-to-end offline behavior may differ between dev and production.
3. Shader compilation timing differs between dev and production modes.

### Verification Checklist

1. **`npm run build && npm run start`** — confirms no Turbopack/TF.js bundling errors.
2. **Open Chrome to `localhost:3000`** — navigate to Nayan AI.
3. **Check SW model cache** — DevTools → Application → Cache Storage → `shasthyahub-models-v1`: both `model.json` and `group1-shard1of1.bin` should be present.
4. **Offline test** — disconnect WiFi, upload an eye image, click Analyze:
   - Console shows: `[NayanTF] Backend selected: webgl` (or webgpu/wasm)
   - Console shows: `[NayanTF] Model loaded. Input shape: [1,224,224,3]`
   - Result appears within ~1-2s with "Preliminary · Offline" badge
5. **Reconnect** — after network returns, the badge should auto-upgrade to "Verified · Online"

---

## Known Bugs Encountered & Fixed

| # | Symptom | Root Cause | Fix |
|---|---------|-----------|-----|
| 1 | `loadGraphModel()` always failed | Model format is `layers-model` (Keras), not `tfjs-model` (SavedModel) | Changed to `loadLayersModel()` in `lib/ai/tensorflow-nayan.ts:76` |
| 2 | Status locked to `'unsupported'` on page load | Module-level eager `loadModel()` called on import, failed, and never retried | Removed eager auto-load at bottom of `lib/ai/tensorflow-nayan.ts` |
| 3 | Offline model load failed with `ERR_INTERNET_DISCONNECTED` | HEAD pre-check before `loadLayersModel()` bypassed SW cache (SW only intercepts GET) | Removed HEAD pre-check at `lib/ai/tensorflow-nayan.ts:75-89` |
| 4 | SW prefetch only cached `model.json`, not `group1-shard1of1.bin` | `setTimeout(doPrefetch, 5000)` inside `activate` handler wasn't awaited by `event.waitUntil`; SW terminated before bin file finished downloading | Model prefetch runs immediately inside `waitUntil` promise chain — `public/sw.js:103-114` |
| 5 | Dev logs invisible in production | `devLog()` gated by `process.env.NODE_ENV` checks | Removed NODE_ENV gate — `lib/ai/tensorflow-nayan.ts:42` |
| 6 | Console CSP warning about TF.js worker | TF.js creates Web Worker from `blob:` URL; `worker-src` not set in CSP | Added `worker-src 'self' blob;` to `middleware.ts:69` |
| 7 | Gemini fallback got 404 | `gemini-1.5-flash` not exposed in v1beta API | Changed to `gemini-2.0-flash` at `lib/ai/gemini.ts:129,132,134` |
| 8 | API failures showed error instead of falling back to offline | No `catch` fallback in online path | Added auto-fallback on 429, quota, TypeError in `hooks/useNayanAnalysis.ts` |
| 9 | Rate limiter blocked testing at 10 req/min | `maxRequests: 10` too low for dev testing | Bumped to 100 in dev at `lib/rate-limit.ts:10` |

---

## Stage 1a: Model Training & Conversion

The offline model must be trained and converted separately in Python. The files go to `public/models/nayan-ai/`.

### Conversion Problem

When converting Keras 3 models to TensorFlow.js, the output `model.json` frequently suffers from structural corruption — nested `dtype` objects, invalid `inbound_nodes` arrays, and unsupported `batch_shape` keys. This prevents the model from loading in the browser.

### Solution: Two-Stage Extraction Pipeline

Strip modern Keras 3 metadata, rebuild under Keras 2 (`tf_keras`), reassign weights, and export a clean TF.js bundle.

---

#### Stage 1: Weight Extraction & Architecture Auditing

Run in your active training environment (Colab/Kaggle) *before* restarting. Saves pure weights and dumps architecture parameters.

```python
import numpy as np

model.save_weights('/content/nayan_weights.weights.h5')

dropout_layer = model.get_layer('dropout')
dense_layer = model.get_layer('dense')

print("=== Architecture parameters (copy these down) ===")
print("Input shape:", model.input_shape)
print("Dropout rate:", dropout_layer.rate)
print("Dense units:", dense_layer.units)
print("Dense activation:", dense_layer.activation.__name__)

test_input = np.random.RandomState(42).rand(1, *model.input_shape[1:]).astype('float32')
original_pred = model.predict(test_input, verbose=0)
np.save('/content/test_input.npy', test_input)
np.save('/content/original_pred.npy', original_pred)
print("\nOriginal prediction:", original_pred)
print("\n✅ Weights and verification data saved.")
print("   Now: Runtime → Restart session (NOT 'Restart and run all').")
```

**Critical**: After Stage 1, restart the runtime (not "Restart and run all") to reset Keras 3 environment variables before Stage 2.

#### Stage 2: Legacy Environment Rebuild & TF.js Conversion

Run in a **fresh cell** after restart. Sets `TF_USE_LEGACY_KERAS=1`, rebuilds the identical architecture via `tf_keras`, loads saved weights, verifies prediction equality, converts to quantized TF.js, and validates the output for corruption.

```python
import os
os.environ["TF_USE_LEGACY_KERAS"] = "1"   # MUST be set before importing tensorflow

!pip install -q tf_keras

import tensorflow as tf
import tf_keras
import numpy as np
import json
import shutil

# Fill these from Stage 1's printed output
DROPOUT_RATE = 0.2
DENSE_UNITS = 3
DENSE_ACTIVATION = 'softmax'

base_model = tf_keras.applications.MobileNetV2(
    input_shape=(224, 224, 3), include_top=False, weights=None
)
inputs = tf_keras.Input(shape=(224, 224, 3))
x = base_model(inputs)
x = tf_keras.layers.GlobalAveragePooling2D()(x)
x = tf_keras.layers.Dropout(DROPOUT_RATE)(x)
outputs = tf_keras.layers.Dense(DENSE_UNITS, activation=DENSE_ACTIVATION)(x)
inference_model = tf_keras.Model(inputs=inputs, outputs=outputs)
inference_model.summary()

# Load saved weights by name (avoids broken Keras 3 config)
inference_model.load_weights('/content/nayan_weights.weights.h5')

# Verify predictions match
test_input = np.load('/content/test_input.npy')
original_pred = np.load('/content/original_pred.npy')
new_pred = inference_model.predict(test_input, verbose=0)
print("\nOriginal prediction: ", original_pred)
print("Reloaded prediction: ", new_pred)
match = np.allclose(original_pred, new_pred, atol=1e-4)
print("Outputs match:", match)
if not match:
    raise SystemExit("⚠️ STOP — weights didn't load correctly. "
                     "Check DROPOUT_RATE/DENSE_UNITS/DENSE_ACTIVATION.")

# Save with legacy Keras 2 format
h5_path = '/content/nayan_model_legacy.h5'
inference_model.save(h5_path)
print(f"\nSaved (legacy Keras format) to {h5_path}")

# Convert to TensorFlow.js with uint8 quantization
tfjs_output = '/content/nayan-ai-tfjs'
if os.path.exists(tfjs_output):
    shutil.rmtree(tfjs_output)

convert_cmd = (
    f"tensorflowjs_converter --input_format=keras --quantize_uint8=* "
    f"{h5_path} {tfjs_output}"
)
print(f"\nRunning: {convert_cmd}")
exit_code = os.system(convert_cmd)
if exit_code != 0:
    raise SystemExit(f"⚠️ Converter failed with exit code {exit_code}.")

if not os.path.exists(os.path.join(tfjs_output, 'model.json')):
    raise SystemExit("⚠️ model.json was not created.")

print(f"\n✅ Conversion succeeded. Files:", os.listdir(tfjs_output))

# Validate model.json for Keras 3 corruption patterns
with open(os.path.join(tfjs_output, 'model.json')) as f:
    model_json = json.load(f)

def check_corruption(config, path=""):
    issues = []
    if isinstance(config, dict):
        if 'batch_shape' in config:
            issues.append(f"{path}: found 'batch_shape'")
        if 'dtype' in config and isinstance(config['dtype'], dict):
            issues.append(f"{path}: 'dtype' is an object")
        if 'inbound_nodes' in config and config['inbound_nodes'] \
           and not isinstance(config['inbound_nodes'][0], list):
            issues.append(f"{path}: 'inbound_nodes' not plain arrays")
        for k, v in config.items():
            issues += check_corruption(v, f"{path}.{k}")
    elif isinstance(config, list):
        for i, item in enumerate(config):
            issues += check_corruption(item, f"{path}[{i}]")
    return issues

problems = check_corruption(model_json)
if problems:
    print(f"\n⚠️ {len(problems)} corruption pattern(s) still found:")
    for p in problems[:10]:
        print(" -", p)
    raise SystemExit("Still corrupted — do not deploy.")
else:
    print("\n✅ model.json is clean — no Keras-3 corruption patterns.")

# Zip for download
shutil.make_archive('/content/nayan-ai-tfjs', 'zip', tfjs_output)
print("\n✅ Zipped to /content/nayan-ai-tfjs.zip")

# Platform-specific download
try:
    from google.colab import files
    files.download('/content/nayan-ai-tfjs.zip')
except ImportError:
    print("\nℹ️ Kaggle: File saved to disk. Open right sidebar → Output → download icon on 'nayan-ai-tfjs.zip'.")
```

### Platform Instructions

#### Google Colab
- Paths like `/content/...` work natively.
- The final `google.colab.files.download()` triggers a browser download popup automatically.

#### Kaggle Notebooks
- Replace `/content/` with `/kaggle/working/` to route files into the persistent directory.
- `google.colab.files.download()` is not available. Instead: right sidebar → Data/Output tab → expand tree → click download icon on `nayan-ai-tfjs.zip`.

### Deployment

After conversion, extract the zip contents to `public/models/nayan-ai/`:
```
public/models/nayan-ai/
├── model.json
└── group1-shard1of1.bin   (may be named differently — update SW prefetch list if so)
```

If the weight shard filename differs from `group1-shard1of1.bin`, update both:
- `public/sw.js` — the `MODEL_FILES` array in the activation prefetch
- `lib/ai/tensorflow-nayan.ts` — not needed (TF.js resolves the path from weightsManifest)

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
| `navigator.onLine` 10-30s lag on Windows/Chrome after WiFi disconnect | Online path fails first, fallback works — adds latency, not a correctness issue |
| No offline history: `useNayanHistory` queries Supabase directly | Would need local IndexedDB-based history |
| Gemini free tier exhausted (both 2.5-flash and 2.0-flash) | Need new API key or billing |
| Only Nayan AI agent has TF.js offline mode | ScriptGuard and GlycoVision still require network (Phase 2+) |
| `crypto.randomUUID()` for offline result IDs | Works in all modern browsers. Falls back on very old browsers. |
| No automatic re-fetch of updated results | After SW sync marks an item as `synced`, the page does not automatically re-query the server. The reconnect effect handles only the most recent analysis during the current page session. |

---

## Model Details

- **Format**: Keras `Functional` API → TensorFlow.js `layers-model`
- **Backbone**: MobileNetV2 (1.00, 224×224), ImageNet-pretrained → fine-tuned 3-class head
- **Classes**: `normal` (index 0) → `refer` (1) → `urgent` (2)
- **Input**: `[1, 224, 224, 3]` float32, normalized [0,1]
- **Quantization**: uint8 (via `tensorflowjs_converter --quantize_uint8=*`)
- **Files**:
  - `public/models/nayan-ai/model.json` — model topology + weights manifest
  - `public/models/nayan-ai/group1-shard1of1.bin` — weight values (~2.2 MB)
