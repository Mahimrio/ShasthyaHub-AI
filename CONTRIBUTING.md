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

## Initial Setup (After Cloning)

```bash
# 1. Clone the repo
git clone <repo-url>
cd shasthyahub-ai

# 2. Install dependencies
npm install

# 3. Copy the example env file
cp .env.example .env.local

# 4. Ask the team lead for the API keys and fill in .env.local

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the landing page.

## Environment Variables

Ask the team lead for these values. **Never commit `.env.local`** — it is already in `.gitignore`.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
USDA_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure Quick Reference

```
shasthyahub-ai/
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
└── types/index.ts        → Shared TypeScript types
```

## Branching Strategy

We use **feature branches** off `main`:

```bash
# Always start from latest main
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

### Branch Naming Convention

| Prefix | Use Case |
|--------|----------|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code improvements |
| `docs/` | Documentation only |
| `chore/` | Config, deps, tooling |

Format: `feature/your-name/short-description`

## Commit Message Convention

Use clear, descriptive commits:

```bash
# Format: <type>(scope): <description>
git commit -m "feat(nayan-ai): add image upload component"
git commit -m "fix(supabase): handle cookie refresh on server"
git commit -m "style(dashboard): fix mobile responsive layout"
git commit -m "docs: update contributing guide"
```

### Allowed Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `style` | UI/styling changes |
| `refactor` | Code restructuring |
| `docs` | Documentation |
| `chore` | Config or tooling |
| `test` | Adding tests |

## Pull Request Workflow

1. **Push your branch:**
   ```bash
   git push origin feature/your-name/short-description
   ```

2. **Open a PR on GitHub** targeting `main`

3. **PR Title** must follow commit convention:
   ```
   feat(nayan-ai): add image upload with compression
   ```

4. **PR Description** should include:
   - What changed
   - Why it changed
   - How to test it
   - Screenshots (if UI changed)

5. **Get at least 1 approval** before merging

6. **Delete your branch** after merge

## Code Style Rules

### TypeScript
- **No `any` types** — use proper types in `types/index.ts` or inline
- All functions must have explicit return types for exported functions
- Use `interface` for object shapes, `type` for unions/intersections

### React
- Use **functional components only** (no class components)
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

## Who Owns What (Suggested)

| Team Member | Area | Files to Focus On |
|-------------|------|-------------------|
| **Member 1** | Nayan AI Agent | `app/(dashboard)/nayan-ai/`, `app/api/nayan/`, `lib/ai/gemini.ts` |
| **Member 2** | ScriptGuard Agent | `app/(dashboard)/scriptguard/`, `app/api/scriptguard/`, `lib/services/drug-*` |
| **Member 3** | GlycoVision Agent | `app/(dashboard)/glycovision/`, `app/api/glycovision/`, `lib/services/calorie.ts` |
| **Member 4** | Auth & Infrastructure | `app/(auth)/`, `lib/supabase/`, `app/(dashboard)/layout.tsx`, `app/api/health/` |

> **Note:** These are starting assignments. Communicate in the group chat before working on another member's area.

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

## Before You Push — Checklist

- [ ] Code compiles: `npm run build` passes with no errors
- [ ] No `console.log` left in production code
- [ ] No secrets or API keys in code (only in `.env.local`)
- [ ] Components are properly typed (no `any`)
- [ ] New files follow naming convention (`kebab-case`)
- [ ] You pulled latest `main` before pushing

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