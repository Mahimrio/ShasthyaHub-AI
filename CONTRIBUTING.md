# Contributing to ShasthyaHub-AI

Welcome to the team! This guide ensures everyone can set up and work on the project without issues.

## Prerequisites

Before you begin, install these on your machine:

- **Node.js 20** (CI runs on 20; recommended: install via [nvm](https://github.com/nvm-sh/nvm))
- **Git** — [Download](https://git-scm.com/)
- **GitHub CLI** (`gh`) — optional, handy for opening PRs from the terminal
- **VS Code** (recommended) with these extensions:
  - ESLint (`dbaeumer.vscode-eslint`)
  - Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
  - Prettier (`esbenp.prettier-vscode`)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/Mahimrio/ShasthyaHub-AI.git
cd ShasthyaHub-AI

# 2. Install dependencies
npm install

# 3. Copy the example env file
cp .env.example .env.local

# 4. Fill in API keys (ask team lead for values), then verify them
node scripts/check-env.mjs
node scripts/probe-keys.mjs

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the landing page.

### Database setup (once per Supabase project)

Run in the Supabase SQL editor, in order: `supabase/schema.sql` → `seed.sql` → `storage-setup.sql` → `doctors.sql` → `migrations/001` … `007`. Migrations are idempotent, so re-running one is safe. Adding a table or column? Create `supabase/migrations/008_<what>.sql` (never edit an applied migration) and mention it in your PR description so the team lead can apply it.

## Environment Variables

**Never commit `.env.local`** — it is already in `.gitignore`.

Ask the team lead for these values:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://jdpfztijnkyzfvyofgri.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI APIs (required)
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here

# AI APIs (optional)
GEMINI_API_KEYS=key_one,key_two   # multi-project pool, rotates on 429
OPENROUTER_API_KEY=your_openrouter_key   # extra reasoning fallback

# Nutrition API (optional)
USDA_API_KEY=your_usda_key_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Where to Get API Keys

| Key | Source |
|-----|--------|
| Supabase URL | Supabase Dashboard → Settings → API → Project URL |
| Supabase Anon Key | Supabase Dashboard → Settings → API → anon public |
| Supabase Service Role | Supabase Dashboard → Settings → API → service_role (keep secret!) |
| Gemini API Key | [Google AI Studio](https://aistudio.google.com/apikey) — new keys only work with Gemini 3.x models (the app uses 3.5 Flash / 3.1 Flash TTS) |
| Groq API Key | [console.groq.com](https://console.groq.com/keys) — free tier is 8,000 tokens/min |
| OpenRouter API Key | [openrouter.ai/keys](https://openrouter.ai/keys) (optional) |
| USDA API Key | [USDA FoodData Central](https://fdc.nal.usda.gov/api-key-signup.html) (optional) |

## Project Structure

```
ShasthyaHub-AI/
├── app/
│   ├── (auth)/               → Login, Register, Forgot-password (public)
│   ├── (dashboard)/          → Main app pages (protected)
│   │   ├── page.tsx          → Home: health score, agents, recent activity
│   │   ├── nayan-ai/         → Eye screening agent
│   │   ├── scriptguard/      → Prescription agent + My Medicines pillbox
│   │   ├── glycovision/      → Food & glucose agent
│   │   ├── lokhon/[slug]/    → Symptom questionnaires
│   │   ├── family/           → Poribar: family tree, caregiver alerts
│   │   └── reports/          → Report history
│   ├── demo/                 → Public demos (no auth)
│   └── api/                  → nayan, scriptguard, glycovision, lokhon, chat, chat/scoped,
│                               family, medications, reports, profile, health
├── components/
│   ├── chat/                 → Shasthya Bondhu widget
│   ├── chat/scoped/          → In-page "Ask <agent>" composer, transcript, history overlay
│   ├── features/             → Per-agent components (+ family, medications)
│   ├── layout/  shared/      → Navigation, footer, BrandWordmark, ImageUploader, toggles
│   └── ui/                   → shadcn/ui components
├── contexts/                 → LanguageContext, DarkModeContext, PageChatPresenceContext
├── hooks/                    → use<Agent>Analysis, useChat, useScopedChat, useFamily, useMedicationReminders…
├── lib/
│   ├── supabase/             → DB & auth clients (server + browser)
│   ├── ai/                   → gemini, groq, openrouter, chat, chat-stream, scoped-context, TF.js, Tesseract
│   ├── services/             → Drug mapping, interactions, calories, Lokhon scoring, schedules
│   ├── family/  medications/ → Authorization helpers, nudges, local fallback stores
│   └── utils.ts              → Helper functions
├── supabase/                 → schema, seed, storage, doctors, migrations 001–007
├── scripts/                  → check-env, probe-keys, audit-nayan, generate-icons
├── test-images/              → Sample eye / prescription / meal photos for manual testing
├── types/index.ts            → Shared TypeScript types
└── .github/workflows/        → CI/CD pipeline
```

## Who Works On What

| Member | Area | Files to Focus On |
|--------|------|-------------------|
| **Member 1** | Nayan AI Agent | `app/(dashboard)/nayan-ai/`, `app/api/nayan/`, `lib/ai/gemini.ts`, `lib/ai/tensorflow-nayan.ts` |
| **Member 2** | ScriptGuard + Medications | `app/(dashboard)/scriptguard/`, `app/api/scriptguard/`, `app/api/medications/`, `lib/services/drug-*`, `components/features/medications/` |
| **Member 3** | GlycoVision + Lokhon | `app/(dashboard)/glycovision/`, `app/(dashboard)/lokhon/`, `app/api/glycovision/`, `app/api/lokhon/`, `lib/services/calorie.ts`, `lib/services/lokhon-*` |
| **Member 4** | Auth, Family, Chat & Dashboard | `app/(auth)/`, `app/(dashboard)/family/`, `app/api/family/`, `app/api/chat/`, `components/chat/`, `lib/supabase/`, `app/(dashboard)/layout.tsx` |

> **Note:** Communicate in the group chat before working on another member's area.

## Manual testing with the bundled images

`test-images/` ships three real samples. Use them through the page uploader or the paperclip in the page's AI composer:

| File | Page | Expected result |
|------|------|-----------------|
| `Eye.png` | Nayan AI | Mature cataract, High severity, ophthalmologist within days |
| `Prescription.png` | ScriptGuard | ~10 medicines mapped to generics, at least one interaction flagged, schedule built |
| `Kacchi.png` | GlycoVision | Kacchi biryani — Red risk level, glycemic load ~40, diabetes flagged |

A full ScriptGuard run takes 20–50 s (two Gemini calls + batched Groq reasoning); Nayan and GlycoVision take 10–20 s.

## Git Workflow

### Branching Strategy

Always use **feature branches** off `main` — never push to `main` directly.

```bash
# Start from latest main
git checkout main
git pull origin main

# Create your feature branch: <type>/<short-description>
git checkout -b feature/nayan-ai-upload

# Examples:
git checkout -b feature/family-tree-zoom
git checkout -b fix/dose-timezone
git checkout -b style/typography-brand-wordmark
git checkout -b docs/readme-refresh
```

Once a PR is merged, **do not push more commits to that branch** — they will not show up anywhere. Branch again from `main` and open a new PR.

### Branch Naming

| Prefix | Use Case |
|--------|----------|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code improvements |
| `style/` | Visual / typography changes |
| `docs/` | Documentation only |
| `chore/` | Config, deps, tooling |

### Commit Messages

**CI enforces conventional commits** (commitlint). Format:

```bash
# <type>(scope): <description>
git commit -m "feat(nayan-ai): add image upload component"
git commit -m "fix(supabase): handle cookie refresh on server"
git commit -m "chore(root): update dependencies"
git commit -m "docs: update contributing guide"
```

Rules that actually fail CI:

- **Allowed types:** `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`, `ci`, `build`, `revert`
- **Header** ≤ 120 characters; subject must not be Start Case, PascalCase or UPPER CASE
- **Body lines** ≤ 100 characters each — wrap bullet points (this is the one people hit most)

Check locally before pushing:

```bash
npx commitlint --from origin/main --to HEAD
```

### Push & PR

```bash
# Push your branch
git push -u origin feature/short-description

# Open a PR on GitHub targeting main (or: gh pr create --base main)
# Wait for CI checks to pass
# Get at least 1 approval
# Merge
# Delete your branch
```

In the PR description, list any **new migration** the team lead must run and any **new env variable**.

## CI/CD Pipeline

We use **GitHub Actions** for CI/CD. Every push and PR triggers:

### Check Job (runs on every push/PR)
1. **TypeScript type check** — `npx tsc --noEmit`
2. **ESLint** — `npm run lint`
3. **Build** — `npm run build`

### Deploy Preview (runs on PRs only)
- Deploys a preview URL to Vercel
- Posts the preview URL as a comment on your PR
- Only runs after Check job passes

### Deploy Production (runs on push to main)
- Deploys to production on Vercel
- Only runs after Check job passes

### Commit Lint
- Enforces conventional commit format
- Fails if commit message doesn't match `feat:`, `fix:`, `chore:`, etc.

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production (overwrites .next — restart the dev server afterwards)
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type check (tsc --noEmit)
node scripts/check-env.mjs    # Verify .env.local
node scripts/probe-keys.mjs   # Live-check Gemini / Groq / OpenRouter keys
```

## Code Style Rules

### TypeScript
- **No `any` types** — use proper types in `types/index.ts` or inline
- All exported functions must have explicit return types
- Use `interface` for object shapes, `type` for unions/intersections
- Validate request bodies at the API boundary with `zod` (see `app/api/chat/scoped/route.ts`)

### React
- **Functional components only** (no class components)
- One component per file; export default from every page component
- **Never call `createClient()` from `@/lib/supabase/client` in a hook or component body** — always `await import('@/lib/supabase/client')` inside `useEffect` or an event handler. Pages are prerendered at build time and the browser client throws without env vars. See AGENTS.md for the full explanation.
- Every user-facing string exists in **both** Bangla and English (`lang === 'bn' ? '…' : '…'`); errors from API routes carry `error` and `error_bn`
- Icons come from `lucide-react` — no emojis in the UI

### Imports
```typescript
// Order: external libs → next/ → @/ components → @/ lib → local
import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/utils';
```

### Tailwind CSS
- Use shadcn/ui components from `components/ui/` when available
- Utility classes only — no custom CSS unless absolutely necessary
- Responsive: mobile-first (`sm:`, `md:`, `lg:`); phones use the bottom nav, tablets the drawer, `md+` the sidebar
- Class names must be static strings (Tailwind cannot see `bg-${color}-500`); keep per-agent colours in a map like `components/chat/scoped/agentTheme.ts`
- Glass surfaces: use the `glass-panel` / `glass-card` classes from `app/globals.css` (plain `backdrop-filter` declarations are dropped by the CSS build; the classes use `@apply backdrop-blur-*`)
- Fonts: Plus Jakarta Sans (Latin) and Hind Siliguri (Bengali) are loaded in `app/layout.tsx`; don't add `font-family` declarations elsewhere

### AI calls
- Groq free tier is 8,000 tokens/minute — always pass `max_completion_tokens` and `reasoning_effort: 'low'`
- JSON pipelines go through `callGroq`; chat streams go through `lib/ai/chat-stream.ts`. Don't mix them.
- Every assistant prompt must keep the safety rules (no diagnosis, emergency numbers, "confirm with a doctor")

## Before You Push — Checklist

- [ ] `npm run type-check`, `npm run lint` and `npm run build` pass
- [ ] No `console.log` left in production code
- [ ] No secrets or API keys in code (only in `.env.local`)
- [ ] Components are properly typed (no `any`)
- [ ] Both languages covered for any new text; dark mode checked
- [ ] You pulled latest `main` before branching
- [ ] Commit messages pass `npx commitlint --from origin/main --to HEAD`
- [ ] New migrations / env vars are called out in the PR description

## Common Issues & Fixes

### "Module not found" after pulling
```bash
npm install
```

### TypeScript errors after pulling
```bash
npm run type-check   # Shows all type errors with file:line
```

### Styles or fonts look stale after pulling
Turbopack's dev cache can keep serving the old compiled `globals.css`, even after restarting.
```bash
# stop the dev server, then
rm -rf .next        # PowerShell: Remove-Item -Recurse -Force .next
npm run dev
```
If a page still looks wrong, unregister the service worker in DevTools → Application and hard-refresh.

### Port 3000 already in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- -p 3001
```

### Supabase auth errors
- Make sure `.env.local` has the correct keys
- Free-tier projects pause after inactivity — open the Supabase dashboard and restore the project
- Check that cookies are enabled in your browser; try incognito mode

### AI calls fail
- `node scripts/probe-keys.mjs` tells you which provider/key is broken
- Gemini `404 model not available`: the key is a new-style key — stick to the 3.x models already configured
- Groq `413`: request exceeded 8,000 tokens/min — lower `max_completion_tokens` or trim the prompt
- Groq down entirely? The app falls back to OpenRouter and then Gemini automatically; check the `x-provider` header

### shadcn/ui component missing
```bash
npx shadcn@latest add <component-name>
# Example: npx shadcn@latest add dropdown-menu
```

## Deployment

The project auto-deploys to Vercel:

- **Preview deploys** — every PR gets a preview URL
- **Production deploys** — merging to `main` deploys to production

Production URL: Check the Vercel dashboard or the GitHub deployment status.

## Communication

- **Daily sync**: Quick update in group chat (what you did, what's next)
- **Blockers**: Message the group immediately — don't wait
- **Code review**: Review PRs within 24 hours

## Getting Help

- Check this file first
- Search the [Next.js docs](https://nextjs.org/docs)
- Search the [Supabase docs](https://supabase.com/docs)
- Ask in the team group chat

---

Built for AUST CSE Carnival 8.0 (Project Showcase) — Team ShasthyaHub