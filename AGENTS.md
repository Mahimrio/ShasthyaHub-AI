# ShasthyaHub-AI — Agent Guide

**Next.js 16 + TypeScript** health AI app (SciBlitz AI Challenge 2026, Track A). Three AI agents: Nayan AI (eye), ScriptGuard (prescription), GlycoVision (food).

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
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss` plugin (no `tailwind.config.ts` file exists despite `components.json` referencing it)
- **UI**: shadcn/ui (new-york style, RSC enabled) — 11 components in `components/ui/`
- **Auth**: Supabase (cookie-based SSR via `@supabase/ssr`) — clients at `lib/supabase/server.ts` & `client.ts`
- **AI**:
  - **Online**: Dual pipeline — Gemini 2.5 Flash (`lib/ai/gemini.ts`) → Groq Llama 3.3 70B (`lib/ai/groq.ts`), orchestrated via `lib/ai/orchestrator.ts`
  - **Offline (Nayan AI only)**: TensorFlow.js (`lib/ai/tensorflow-nayan.ts`) — module singleton, WebGPU→WebGL→WASM backend fallback, 3-class CNN (normal/refer/urgent)
- **Offline Infrastructure (Phase 0)**: Network detection (`hooks/useNetworkStatus.ts`), IndexedDB queue (`lib/offline-queue.ts`), SW caching in `public/sw.js`, debug page at `/debug-offline`
- **State**: TanStack React Query (installed, no provider set up yet)
- **i18n**: `next-i18next` installed, **not configured** (no locale files)
- **PWA**: `next-pwa` installed, **not configured**

## Project state

**Phase 0 (Offline Infrastructure)** — Complete: pessimistic network detection, WebP-compressed IndexedDB queue, hand-written SW with RSC caching, background sync, debug page.

**Phase 1 (Nayan Offline AI)** — Complete: TensorFlow.js integration with module-level singleton, 3-bucket classification, automatic online/offline routing, SW model caching (`shasthyahub-models-v1`), warm-up inference, graceful missing-files handling. Model training/conversion (Phase 1a) is pending — place output at `public/models/nayan-ai/`.

**Feature pages completed**: Nayan AI, ScriptGuard, GlycoVision, Reports dashboard — all with dark mode, BN/EN i18n, skeleton loaders, shared components (ImageUploader, ResultCard, DisclaimerModal, AiThinkingBanner). Responsive dashboard layout with sidebar + bottom nav. Dark mode system active. Auth system complete (login, register, middleware). `hooks/useAuth.ts` exists.

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
| Nayan AI (eye) | Gemini 2.5 Flash → | Groq Llama 3.3 70B | `analyzeEyeImage()` |
| Nayan AI (offline) | TensorFlow.js CNN | — | `analyzeEyeImageOffline()` in `lib/ai/tensorflow-nayan.ts` |
| ScriptGuard (rx) | Gemini 2.5 Flash → | Groq + OpenFDA | `analyzePrescription()`, `mapBrandsToGenerics()`, `checkDrugInteractions()` |
| GlycoVision (food) | Gemini 2.5 Flash → | Groq Llama 3.3 70B | `analyzeFood()`, `lookupNutrition()`, `calculateTotalNutrition()` |

All pipelines have Gemini Flash fallback when Groq is unavailable. Offline Nayan AI runs locally in browser via TensorFlow.js when network is unavailable and model files are present at `public/models/nayan-ai/`.

## Database

6 tables in `supabase/schema.sql`. Run in order: `schema.sql` → `seed.sql` → `storage-setup.sql`. RLS on all tables. `supabase/seed.sql` has 65 drugs + 85 food items.

## Deployment

- **Vercel**: API routes get 60s `maxDuration` via `vercel.json`. CI/CD in `.github/workflows/ci.yml` has dummy fallback env vars for `npm run build`; Vercel deploy steps also pass fallback env vars.
- **CI pipeline order**: `npx tsc --noEmit` → `npm run lint` → `npm run build`. Uses Node.js 20, `npm ci`.

## Git workflow

- **Never push directly to `main`**. Always create a feature branch, push there, and let the user merge via PR.
- Branch naming: `type/<brief-description>` where type matches commit types: `feature/`, `fix/`, `docs/`, `refactor/`, `perf/`, `ci/`, `build/`, `chore/`.
- If more changes are needed after a commit, create **additional commits on the same branch** (never amend).
- Commit format: `type(scope): message` — e.g. `feat(db): add schema, seed data, storage setup, and populate service layer`

## Commit convention

Conventional commits enforced by commitlint. Allowed types: `feat|fix|docs|style|refactor|test|perf|ci|build|revert|chore`. Max header 100 chars, sentence-case subject. Example: `feat(auth): add login page`

## Gotchas

- No `.env.local` in repo (it's gitignored). Copy `.env.example` and fill in keys.
- `components.json` references `hooks` alias but `hooks/` dir doesn't exist.
- `components.json` references `tailwind.config.ts` but it doesn't exist (Tailwind v4 uses CSS-based config).
- AI keys required at runtime: `GEMINI_API_KEY`, `GROQ_API_KEY`.

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
