# ShasthyaHub-AI — Agent Guide

**Next.js 16 + TypeScript** health AI app, built for **AUST CSE Carnival 8.0 — Project Showcase**. Four AI agents — Nayan AI (eye), ScriptGuard (prescription), GlycoVision (food), Lokhon (symptoms) — plus the Shasthya Bondhu floating AI chatbot, in-page "Ask &lt;agent&gt;" composers, the Poribar family layer and medication reminders.

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Production build |
| `npm run lint` | ESLint (root config) |
| `npm run type-check` | `tsc --noEmit` (NOT just `tsc`) |

No test framework exists. No `npm test`.

## Architecture

- **Framework**: Next.js 16 App Router, `@/*` maps to root, TypeScript strict mode
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss` plugin (no `tailwind.config.ts` file exists despite `components.json` referencing it). Fonts via `next/font` in `app/layout.tsx`: **Plus Jakarta Sans** (`--font-sans`, Latin) + **Hind Siliguri** (`--font-bengali`); `html[lang="bn"]` / `.font-bengali` rules in `globals.css` remap weights. Glass surfaces use `@apply backdrop-blur-*` (plain `backdrop-filter` declarations are dropped by the CSS build). Class names must be static strings.
- **Brand**: `components/shared/BrandWordmark.tsx` — "Shasthya" gradient + "Hub" neutral; use it instead of typing the name.
- **UI**: shadcn/ui (new-york style, RSC enabled) — 11 components in `components/ui/`
- **Auth**: Supabase (cookie-based SSR via `@supabase/ssr`) — clients at `lib/supabase/server.ts` & `client.ts`
- **AI**:
  - **Online**: Gemini 3.5-flash vision/text (`lib/ai/gemini.ts`, key POOL via `GEMINI_API_KEYS` — rotates on 429; new AQ.-style keys are gated to Gemini 3.x, 2.5 returns 404) → Groq `openai/gpt-oss-120b` reasoning (`lib/ai/groq.ts`, 8K TPM free tier, always set `max_completion_tokens` + `reasoning_effort: 'low'`) → OpenRouter `minimax/minimax-m3:free` fallback (`lib/ai/openrouter.ts`). JSON-mode chain: Groq → OpenRouter → Gemini text.
  - **Chat**: `/api/chat` streams PLAIN TEXT from Groq (separate from the JSON pipeline) with the same fallback chain — prompt helpers in `lib/ai/chat.ts`, shared completion/stream/persist plumbing in `lib/ai/chat-stream.ts`.
  - **Page-scoped chat**: `/api/chat/scoped` (+ `/history`) powers the `PageChat` composer on the four agent pages (`components/chat/scoped/`). The client sends the on-screen analysis as a zod-validated context (`lib/ai/scoped-context.ts`, English-only serialisation); reopened conversations get their context rebuilt from the analysis row. `contexts/PageChatPresenceContext.tsx` hides the global widget while a composer is mounted. Conversations are keyed by `(scope, context_id)` in `chat_messages` (migration 007) with a localStorage index fallback.
  - **TTS**: `/api/scriptguard/tts` → `gemini-3.1-flash-tts-preview` (voice Kore, ~3-8s, PCM→WAV server-side, key-pool failover).
  - **Offline (Nayan AI only)**: TensorFlow.js (`lib/ai/tensorflow-nayan.ts`) — module singleton, WebGPU→WebGL→WASM backend fallback, 3-class CNN. ScriptGuard offline OCR: Tesseract.js v5 (`lib/ai/tesseract-scriptguard.ts`, eng+ben, self-hosted in `public/tesseract-lang/`).
- **Offline Infrastructure (Phase 0)**: Network detection (`hooks/useNetworkStatus.ts`), IndexedDB queue (`lib/offline-queue.ts`), SW caching in `public/sw.js` (network-first for `/_next/static/` and RSC caches on localhost — prevents stale-chunk hydration crashes; cache-first in prod), debug page at `/debug-offline`
- **State**: TanStack React Query (provider wired in `components/providers.tsx`)
- **i18n**: cookie-based (`shasthya_lang`) via `contexts/LanguageContext.tsx`, resolved server-side in the root layout — `next-i18next` is installed but unused
- **PWA**: hand-written `public/sw.js` is the single source of truth (`next-pwa` removed; `app/sw.ts.future` is dead reference code)

## Project state

**All core phases complete.** Phase 0 (offline infra), Phase 1 (Nayan offline TF.js — model files EXIST at `public/models/nayan-ai/`), Phase 2 (ScriptGuard offline OCR via Tesseract).

**Features shipped**: Nayan AI, ScriptGuard (batched drug mapping, ~18-44s, My Medicines pillbox), GlycoVision, Lokhon (zero-LLM weighted symptom scoring, crisis path with 16463 Shuchona helpline), Reports dashboard, Shasthya Bondhu chatbot (streaming, report-aware, red-flag escalation, TTS playback, chat_messages persistence), in-page "Ask &lt;agent&gt;" composers with Simple-words / Doctor-questions modes and a conversation-history overlay, Poribar family system (connections, tree, shared summaries, caregiver alerts, nudges), medication reminders (timezone-aware dose logs, refills, chimes), Bengali TTS on ScriptGuard, doctors directory, public demo pages under `/demo`. All bilingual (BN/EN) with dark mode. Auth complete (login, register, forgot-password, middleware). Responsive layout: desktop sidebar (`md+`), tablet drawer (`sm`–`md`), phone bottom nav, slim app footer, floating chat FAB. Sample inputs live in `test-images/`.

## Service layer

| File | Contents |
|------|----------|
| `lib/services/drug-mapping.ts` | 37 brand→generic Bangladeshi drug mappings |
| `lib/services/drug-interaction.ts` | 28 interactions (major/moderate/minor) |
| `lib/services/calorie.ts` | 66 Bangladeshi food items + `lookupNutrition()` (Supabase→USDA→Groq lookup chain) + `calculateTotalNutrition()` |
| `lib/services/schedule.ts` | Med schedule generator |

## Pipeline

| Agent | Vision model | Reasoning model | Key services |
|-------|-------------|----------------|--------------|
| Nayan AI (eye) | Gemini 3.5 Flash → | Groq gpt-oss-120b | `analyzeEyeImage()` |
| Nayan AI (offline) | TensorFlow.js CNN | — | `analyzeEyeImageOffline()` in `lib/ai/tensorflow-nayan.ts` |
| ScriptGuard (rx) | Gemini 3.5 Flash → | Groq + OpenFDA (evidence capped 700/pair, 4000 total) | `analyzePrescription()`, `mapBrandsToGenerics()` (3-tier: bd_drugs → ONE batched Groq call → static map), `checkDrugInteractions()` |
| GlycoVision (food) | Gemini 3.5 Flash → | Groq gpt-oss-120b | `analyzeFood()`, `lookupNutrition()`, `calculateTotalNutrition()` |
| Lokhon (symptoms) | — (zero-LLM) | weighted scoring, red-flag ≥4 forces Urgent | `app/api/lokhon/*` |
| Shasthya Bondhu (chat) | — | Groq streaming → OpenRouter → Gemini | `lib/ai/chat.ts`, `lib/ai/chat-stream.ts`, `app/api/chat/route.ts` |
| Ask &lt;agent&gt; (page chat) | — | same chain, scoped system prompt | `buildScopedSystemPrompt()`, `lib/ai/scoped-context.ts`, `app/api/chat/scoped/*` |

All JSON pipelines fall back Groq → OpenRouter (if `OPENROUTER_API_KEY` set) → Gemini text; fallback results carry `_fallback_used` + `_fallback_provider`. Offline Nayan AI runs locally in-browser when the network is down and model files are present.

## Database

Base tables in `supabase/schema.sql`. Run in order: `schema.sql` → `seed.sql` → `storage-setup.sql` → `doctors.sql` → `migrations/001..007`. RLS on all tables. Seed data: `bd_drugs` (65 rows) + `bd_food_items` (85 rows), anon-readable. Migrations: 001 chronic_disease_risks, 002 analysis_mode columns, 003 chat_messages, 004 family system, 005 medication reminders, 006 family security hardening + caregiver_nudges + `public.profiles` trigger fix, 007 `chat_messages.scope`/`context_id`. All migrations are idempotent; never edit an applied one — add the next number. Family data is authorised in code too (`lib/family/authorize.ts`) because some routes use the service role.

## Deployment

- **Vercel**: API routes get 60s `maxDuration` via `vercel.json`. CI/CD in `.github/workflows/ci.yml` has dummy fallback env vars for `npm run build`; Vercel deploy steps also pass fallback env vars.
- **CI pipeline order**: `npx tsc --noEmit` → `npm run lint` → `npm run build`. Uses Node.js 20, `npm ci`.

## Git workflow

- **Never push directly to `main`**. Always create a feature branch, push there, and let the user merge via PR.
- Branch naming: `type/<brief-description>` where type matches commit types: `feature/`, `fix/`, `style/`, `docs/`, `refactor/`, `perf/`, `ci/`, `build/`, `chore/`.
- If more changes are needed after a commit, create **additional commits on the same branch** (never amend). Once the PR is **merged**, stop pushing to that branch — branch again from `main` and open a new PR.
- Never `git add -A`: stage explicit paths (the repo root carries untracked hackathon docs).
- Commit format: `type(scope): message` — e.g. `feat(db): add schema, seed data, storage setup, and populate service layer`

## Commit convention

Conventional commits enforced by commitlint (`@commitlint/config-conventional`). Allowed types: `feat|fix|docs|style|refactor|test|perf|ci|build|revert|chore`. Header ≤ 120 chars, subject not Start/Pascal/UPPER case, **body lines ≤ 100 chars**. Check with `npx commitlint --from origin/main --to HEAD` before pushing. Example: `feat(auth): add login page`

## Gotchas

- No `.env.local` in repo (it's gitignored). Copy `.env.example` and fill in keys.
- `components.json` references `tailwind.config.ts` but it doesn't exist (Tailwind v4 uses CSS-based config).
- AI keys required at runtime: `GEMINI_API_KEY` (or `GEMINI_API_KEYS` pool), `GROQ_API_KEY`; optional: `OPENROUTER_API_KEY`, `USDA_API_KEY`.
- New AQ.-style Gemini keys CANNOT use gemini-2.5-* (404 "no longer available to new users") — the app is on 3.5-flash / 3.5-flash-lite / 3.1-flash-tts-preview. Validate keys with `node scripts/probe-keys.mjs`.
- Groq free tier = 8,000 TPM; TPM counts prompt + `max_completion_tokens` (unset reserves the full 65K and 413s). gpt-oss burns budget on hidden reasoning — always pass `reasoning_effort: 'low'`.
- Dev SW is network-first for chunks/RSC on localhost; if a browser holds a pre-fix SW, one hard refresh self-heals. Never trust stale-cache phantom errors before clearing SW caches.
- Turbopack's persistent dev cache can serve a STALE compiled `globals.css` even after restarting `next dev`. If a CSS rule "has no effect", fetch the CSS chunk and grep for it first; if absent, delete `.next` and restart. `npm run build` also overwrites `.next` — restart the dev server afterwards.
- The `logs/` gitignore rule is unanchored; `app/api/medications/logs/` is whitelisted with `!/app/api/medications/logs/`. Check `git check-ignore -v <path>` when a new file refuses to show up.
- Bengali text in files: editing tools may fail on Unicode normalization differences — anchor edits on ASCII-only lines or copy oldString verbatim from a fresh read.

## ⚠ Critical: Supabase client must NEVER be called during static prerendering

Next.js statically prerenders `○` pages during `next build`. During this phase, client component code runs on the server — `useState` initializers and **hook function bodies are executed**, but `useEffect` and event handlers are not.

`@supabase/ssr`'s `createBrowserClient()` validates env vars immediately when called. If env vars are missing, it throws.

**Rule**: Never call `createClient()` directly in a hook/component function body. Always use dynamic `import()` inside `useEffect` or event handlers.

### Files that follow this pattern (reference):
- `hooks/useAuth.ts` — `await import('@/lib/supabase/client')` inside `useEffect`
- `contexts/LanguageContext.tsx` — `await import('@/lib/supabase/client')` inside `setLang()` callback

### Violation that caused the bug (DO NOT RE-INTRODUCE):
```tsx
// ❌ HOOK BODY — runs during SSR prerendering, throws!
const supabase = createClient()
useEffect(() => { /* ... */ }, [])

// ✅ LAZY — runs only on client after mount
useEffect(() => {
  const init = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    // ...
  }
  init()
}, [])
```

### Middleware note:
`middleware.ts` uses `createServerClient` directly (not lazy) because middleware runs per-request, never during static prerendering.
