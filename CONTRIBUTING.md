# Contributing to ShasthyaHub-AI

Welcome to the team! This guide ensures everyone can set up and work on the project without issues.

## Prerequisites

Before you begin, install these on your machine:

- **Node.js 18+** (recommended: install via [nvm](https://github.com/nvm-sh/nvm) for version management)
- **Git** — [Download](https://git-scm.com/)
- **VS Code** (recommended) with these extensions:
  - ESLint (`dbaeumer.vscode-eslint`)
  - Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
  - Prettier (`esbenp.prettier-vscode`)
  - TypeScript Importer (`pmneo.tsimporter`)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/Mahimrio/ShasthyaHub-AI.git
cd ShasthyaHub-AI

# 2. Install dependencies
npm install

# 3. Copy the example env file
cp .env.example .env.local

# 4. Fill in API keys (ask team lead for values)

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the landing page.

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
| Gemini API Key | [Google AI Studio](https://aistudio.google.com/apikey) |
| Groq API Key | [console.groq.com](https://console.groq.com/keys) |
| USDA API Key | [USDA FoodData Central](https://fdc.nal.usda.gov/api-key-signup.html) (optional) |

## Project Structure

```
ShasthyaHub-AI/
├── app/
│   ├── (auth)/           → Login, Register (public)
│   ├── (dashboard)/      → Main app pages (protected)
│   │   ├── page.tsx      → Dashboard home
│   │   ├── nayan-ai/     → Eye scan agent
│   │   ├── scriptguard/  → Prescription agent
│   │   ├── glycovision/  → Glucose tracker
│   │   └── reports/      → Report history
│   ├── demo/             → Public demos (no auth)
│   └── api/              → API routes (server-side)
├── components/ui/        → shadcn/ui components
├── lib/
│   ├── supabase/         → DB & auth clients
│   ├── ai/               → Gemini + Groq wrappers
│   ├── services/         → Business logic
│   └── utils.ts          → Helper functions
├── types/index.ts        → Shared TypeScript types
└── .github/workflows/    → CI/CD pipeline
```

## Who Works On What

| Member | Area | Files to Focus On |
|--------|------|-------------------|
| **Member 1** | Nayan AI Agent | `app/(dashboard)/nayan-ai/`, `app/api/nayan/`, `lib/ai/gemini.ts` |
| **Member 2** | ScriptGuard Agent | `app/(dashboard)/scriptguard/`, `app/api/scriptguard/`, `lib/services/drug-*` |
| **Member 3** | GlycoVision Agent | `app/(dashboard)/glycovision/`, `app/api/glycovision/`, `lib/services/calorie.ts` |
| **Member 4** | Auth & Dashboard | `app/(auth)/`, `lib/supabase/`, `app/(dashboard)/layout.tsx`, `app/api/health/` |

> **Note:** Communicate in the group chat before working on another member's area.

## Git Workflow

### Branching Strategy

Always use **feature branches** off `main`:

```bash
# Start from latest main
git checkout main
git pull origin main

# Create your feature branch
git checkout -b feature/your-name/short-description

# Examples:
git checkout -b feature/ahmed/nayan-ai-upload
git checkout -b feature/fatima/drug-interaction-api
git checkout -b feature/rafi/glycovision-chart
git checkout -b feature/sami/auth-flow
```

### Branch Naming

| Prefix | Use Case |
|--------|----------|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code improvements |
| `docs/` | Documentation only |
| `chore/` | Config, deps, tooling |

### Commit Messages

**CI enforces conventional commits.** Use this format:

```bash
# Format: <type>(scope): <description>
git commit -m "feat(nayan-ai): add image upload component"
git commit -m "fix(supabase): handle cookie refresh on server"
git commit -m "chore(root): update dependencies"
git commit -m "docs: update contributing guide"
```

**Allowed types:** `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`, `ci`, `build`, `revert`

### Push & PR

```bash
# Push your branch
git push origin feature/your-name/short-description

# Open a PR on GitHub targeting main
# Wait for CI checks to pass
# Get at least 1 approval
# Merge
# Delete your branch
```

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
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type check
```

## Code Style Rules

### TypeScript
- **No `any` types** — use proper types in `types/index.ts` or inline
- All exported functions must have explicit return types
- Use `interface` for object shapes, `type` for unions/intersections

### React
- **Functional components only** (no class components)
- One component per file
- File naming: `kebab-case.tsx` (e.g., `image-uploader.tsx`)
- Export default from every page component

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
- Responsive: mobile-first (`sm:`, `md:`, `lg:`)

## Before You Push — Checklist

- [ ] Code compiles: `npm run build` passes with no errors
- [ ] ESLint passes: `npm run lint` shows no errors
- [ ] No `console.log` left in production code
- [ ] No secrets or API keys in code (only in `.env.local`)
- [ ] Components are properly typed (no `any`)
- [ ] New files follow naming convention (`kebab-case`)
- [ ] You pulled latest `main` before pushing
- [ ] Commit message follows conventional format

## Common Issues & Fixes

### "Module not found" after pulling
```bash
npm install
```

### TypeScript errors after pulling
```bash
npm run build   # Shows all type errors with file:line
```

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
- Check that cookies are enabled in your browser
- Try incognito mode

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

Built for SciBlitz AI Challenge 2026 — Team ShasthyaHub