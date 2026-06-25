# ScriptGuard Frontend — Work Done So Far

**Branch:** `feature/scriptguard-schedule`
**Milestone:** 3 of 3 (ScriptGuard UI)
**Status:** ✅ Code complete & validated — ⏳ **Not yet committed** (on request)

---

## 📋 Summary

Built the full ScriptGuard (prescription safety) frontend — the most complex UI
page in ShasthyaHub-AI. It wires the dashboard to the **real backend API**
(`POST /api/scriptguard/analyze`), replacing the old static placeholder page
that always showed hardcoded values.

The page renders results in **safety-first order**:
Drug interactions → Extracted medications → Medication schedule → Audio guide.

---

## ✅ Files Created / Modified

### 1. Type definitions
| File | Change |
|------|--------|
| `types/index.ts` | Added `PrescriptionAnalysisResult` and `ScriptGuardResult` interfaces (UI-facing API response shape with flattened schedule fields). |

### 2. Data-fetching hook (NEW)
| File | Purpose |
|------|---------|
| `hooks/useScriptGuardAnalysis.ts` | One-shot mutation hook. POSTs image as `multipart/form-data` to `/api/scriptguard/analyze`. 60s `AbortController` timeout. Returns `{ analyze, result, isLoading, isError, error, reset }`. Mirrors the `useNayanAnalysis` pattern. |

### 3. Feature components (all NEW, `components/features/scriptguard/`)

| File | Component | What it does |
|------|-----------|--------------|
| `ExtractedMedsTable.tsx` | `ExtractedMedsTable` | Table (desktop) / expandable cards (mobile) showing Written Text · Brand · Generic · Drug Class · Confidence badge (green/yellow/red). Tooltip explains confidence ("High confidence DB match" vs "AI-inferred — verify with pharmacist"). |
| `DrugInteractionAlert.tsx` | `DrugInteractionAlert` | Full-width RED critical banner when `hasDangerous`. Yellow info banner for Moderate/Mild. Expandable per-interaction cards with severity badge, drug pair, risk (EN/BN), mechanism, recommendation callout. Green "no interactions" banner when clean. Sorted Critical → Mild. |
| `MedicationScheduleTimeline.tsx` | `MedicationScheduleTimeline` | 2×2 grid (desktop) / vertical stack (mobile) of morning/afternoon/evening/night. Pill-shaped drug chips colored by name hash. Duration badge. Special instructions in blue callout. **Print button** with `@media print` safe styles. |
| `AudioGuide.tsx` | `AudioGuide` | The killer feature. Gradient header, Play/Pause/Stop, progress bar, current-slot highlight. Uses `window.speechSynthesis` with `lang='bn-BD'`, `rate=0.85`, `pitch=1.0`. Feature detection via `useSyncExternalStore` (SSR-safe). Unsupported-browser fallback message. |

### 4. Pages (modified)

| File | Change |
|------|--------|
| `app/(dashboard)/scriptguard/page.tsx` | **Rewritten** — wired to real API via `useScriptGuardAnalysis`. Header, photo tip box, `ImageUploader` + Analyze button, `AiThinkingBanner` loading, error alert with retry, results in safety order, reset button. **Fixes the "always shows static values" bug** (the old `handleImageSelect` discarded the file via `_imageFile` and used `setTimeout`). |
| `app/demo/scriptguard/page.tsx` | **Rewritten** — hardcoded demo with 3 drugs (Napa/Paracetamol, Seclo/Omeprazole, Azimax/Azithromycin), 1 mild interaction (Paracetamol + Azithromycin), full schedule, playable Bengali audio script. Purple "Demo Mode" banner + EN/BN interaction-text toggle. |

---

## 🔗 Data Flow

```
[User uploads prescription photo]
        │
        ▼
 useScriptGuardAnalysis.analyze(file)
   POST /api/scriptguard/analyze  (multipart/form-data, image)
        │
        ▼
 [Server] analyzePrescription() → mapBrandsToGenerics() → checkDrugInteractions()
          → generateMedicationSchedule()
        │
        ▼
 ScriptGuardResult {
   extracted_drugs: ExtractedMedication[]
   interaction_warnings: DrugInteraction[]
   has_dangerous_interactions: boolean
   schedule: { morning, afternoon, evening, night }[]
   duration_days, special_instructions_en/bn, audio_script_bn
 }
        │
        ▼
 [Dashboard page renders]
   1. DrugInteractionAlert      ← safety first
   2. ExtractedMedsTable
   3. MedicationScheduleTimeline
   4. AudioGuide
```

---

## ✅ Validation Passed

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ Clean |
| `npm run lint` | ✅ 0 errors (1 pre-existing warning in `register/page.tsx`, unrelated) |
| `npm run build` | ✅ 18/18 pages generated — `/scriptguard` + `/demo/scriptguard` prerendered |

**Lint fix applied during build:** `AudioGuide.tsx` originally used `setSupported` inside `useEffect`, which triggered `react-hooks/set-state-in-effect`. Refactored to `useSyncExternalStore` — the canonical SSR-safe browser-feature-detection pattern (server snapshot returns `false`, client snapshot reads live `window.speechSynthesis`).

---

## 🐛 Known Runtime Issues (NOT introduced by this work)

### 1. Audio may stay silent on some devices
**Cause:** `window.speechSynthesis` only speaks languages for which a TTS voice is installed on the **device/OS**. Bengali (`bn-BD`) voices are common on Android Chrome (target users) but often **missing on Windows desktop Chrome / Firefox**.

**Test:** Browser console → `speechSynthesis.getVoices().filter(v => v.lang.startsWith('bn'))`. If empty → no Bengali voice installed.

**Fix options:**
- **(Free)** Install Bengali voice: Windows → Settings → Time & Language → Speech → Add voices → "Bengali". Or test on Android Chrome.
- **(Free)** I can harden `AudioGuide.tsx`: wait for `voiceschanged` event, auto-pick best `bn-*` voice, add Chrome's 15-second `resume()` heartbeat fix, and show a clear message when no Bengali voice exists.
- **(Paid)** Integrate Google Cloud TTS (`bn-IN`/`bn-BD` Neural voices) — works on every device, ~$4/1M chars, needs `GOOGLE_TTS_API_KEY` + a backend route returning audio bytes + an `<audio>` player.

### 2. Groq TPM rate-limit on large drug lists
Observed in dev-server logs: when a prescription has many drugs, the interaction-reasoning Groq call can exceed the free-tier **12,000 TPM** limit and fall back to the static interaction table. The pipeline still completes (3-tier fallback), but results may be less complete. Not a frontend issue.

### 3. Pre-existing `ThemeToggle` hydration warning
`components/shared/ThemeToggle.tsx:20` renders `Sun`/`Moon` based on `dark` state before hydration — unrelated to ScriptGuard, predates this work.

---

## 📦 Git State

- **Branch:** `feature/scriptguard-schedule`
- **Already committed & pushed (2 commits):**
  - `9e63dbb` — `feat(scriptguard): add prescription OCR, drug mapping, and interaction pipeline`
  - `922d5a6` — `feat(scriptguard): add medication schedule generator with bengali output for audio guide`
- **Staged, NOT committed (on request):**
  - `types/index.ts` (modified)
  - `hooks/useScriptGuardAnalysis.ts` (new)
  - `components/features/scriptguard/` — 4 new components
  - `app/(dashboard)/scriptguard/page.tsx` (rewritten)
  - `app/demo/scriptguard/page.tsx` (rewritten)

---

## ⏭️ Next Steps (pending user decision)

1. **Commit & push** the frontend work (currently staged, not committed).
2. Decide on audio hardening approach: free browser-native improvements vs. paid Google Cloud TTS.
3. (Optional) Address pre-existing `ThemeToggle` hydration warning.
