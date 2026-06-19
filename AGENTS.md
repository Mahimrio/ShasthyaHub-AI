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
- **AI**: Dual pipeline — Gemini 1.5 Pro (`lib/ai/gemini.ts`) → Groq Llama 3.3 70B (`lib/ai/groq.ts`), orchestrated via `lib/ai/orchestrator.ts`
- **State**: TanStack React Query (installed, no provider set up yet)
- **i18n**: `next-i18next` installed, **not configured** (no locale files)
- **PWA**: `next-pwa` installed, **not configured**

## Project state

All page components and API routes are **placeholder stubs** (`<h1>` or `Response.json(...)`). No `middleware.ts` — dashboard routes are unprotected. No custom hooks yet (`hooks/` dir expected by `components.json` but doesn't exist). `next.config.ts` is empty.

## Service layer (already populated)

| File | Contents |
|------|----------|
| `lib/services/drug-mapping.ts` | 37 brand→generic Bangladeshi drug mappings |
| `lib/services/drug-interaction.ts` | 28 interactions (major/moderate/minor) |
| `lib/services/calorie.ts` | 66 Bangladeshi food items with macros |
| `lib/services/schedule.ts` | Med schedule generator |

## Database

6 tables in `supabase/schema.sql`. Run in order: `schema.sql` → `seed.sql` → `storage-setup.sql`. RLS on all tables. `supabase/seed.sql` has 65 drugs + 85 food items.

## Deployment

- **Vercel**: API routes get 60s `maxDuration` via `vercel.json`. CI/CD in `.github/workflows/ci.yml` requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` env vars at build time.
- **CI pipeline order**: `npx tsc --noEmit` → `npm run lint` → `npm run build`. Uses Node.js 20, `npm ci`.

## Git workflow

- **Never push directly to `main`**. Always create a feature branch (e.g. `feature/description`), push there, and let the user merge via PR.
- Branch naming: `feature/<brief-description>` (kebab-case).
- Commit format: `type(scope): message` — e.g. `feat(db): add schema, seed data, storage setup, and populate service layer`

## Commit convention

Conventional commits enforced by commitlint. Allowed types: `feat|fix|docs|style|refactor|test|perf|ci|build|revert|chore`. Max header 100 chars, sentence-case subject. Example: `feat(auth): add login page`

## Gotchas

- No `.env.local` in repo (it's gitignored). Copy `.env.example` and fill in keys.
- `components.json` references `hooks` alias but `hooks/` dir doesn't exist.
- `components.json` references `tailwind.config.ts` but it doesn't exist (Tailwind v4 uses CSS-based config).
- AI keys required at runtime: `GEMINI_API_KEY`, `GROQ_API_KEY`.
- Build will fail without at least dummy Supabase env vars.
