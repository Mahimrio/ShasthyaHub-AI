# ShasthyaHub-AI

[![CI](https://github.com/Mahimrio/ShasthyaHub-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/Mahimrio/ShasthyaHub-AI/actions/workflows/ci.yml)

Multi-agent AI healthcare web app for rural Bangladesh — built for **AUST CSE Carnival 8.0 (Project Showcase)**

## Team

Team ShasthyaHub

## Overview

ShasthyaHub-AI is a comprehensive healthcare platform designed for rural Bangladesh, featuring four AI-powered agents and a conversational assistant:

- **Nayan AI** — Eye screening (cataract & retinopathy triage) with an offline TensorFlow.js fallback
- **ScriptGuard** — Prescription analyzer: brand→generic mapping (65+ BD drugs), drug-interaction safety, Bengali audio guide
- **GlycoVision** — Food & glucose analysis with 85+ Bangladeshi food items and chronic-disease risk flags
- **Lokhon** — Zero-LLM symptom checker with weighted triage scoring and a mental-health crisis path
- **Shasthya Bondhu** — Floating bilingual AI chatbot: streaming replies, aware of your recent reports, emergency escalation (999 / 16263 / 16463), voice playback

Fully bilingual (বাংলা + English) with dark mode and PWA offline support.

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript, Turbopack)
- **Database & Auth**: Supabase (PostgreSQL + Auth + Storage, RLS everywhere)
- **Styling**: Tailwind CSS v4 + shadcn/ui + framer-motion
- **State Management**: TanStack React Query
- **AI**: Google Gemini 3.5 Flash (vision/text, multi-key rotation) + Groq GPT-OSS-120B (reasoning) + OpenRouter fallback; Gemini 3.1 Flash TTS for Bengali speech; TensorFlow.js + Tesseract.js for offline
- **Internationalization**: Cookie-based BN/EN (server-side first paint)
- **PWA**: Hand-written service worker (offline queue, model caching)
- **Deployment**: Vercel

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google Gemini API key
- Groq API key
- USDA API key (optional, for nutrition data)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd shasthyahub-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Then edit `.env.local` with your API keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
# Optional: comma-separated keys from separate Cloud projects (rotates on 429)
GEMINI_API_KEYS=key_one,key_two
GROQ_API_KEY=your_groq_api_key
# Optional: extra reasoning fallback (Groq -> OpenRouter -> Gemini)
OPENROUTER_API_KEY=your_openrouter_key
USDA_API_KEY=your_usda_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Set up Supabase — run these in the SQL Editor, in order:
   - `supabase/schema.sql` → `supabase/seed.sql` → `supabase/storage-setup.sql` → `supabase/doctors.sql`
   - then `supabase/migrations/001..003` (chronic risks, analysis_mode, chat_messages)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
shasthyahub-ai/
├── app/
│   ├── (auth)/           # Auth routes (login, register, forgot-password)
│   ├── (dashboard)/      # Protected dashboard routes
│   │   ├── nayan-ai/     # Eye screening
│   │   ├── scriptguard/  # Prescription analyzer
│   │   ├── glycovision/  # Food & glucose analysis
│   │   ├── lokhon/       # Symptom checker
│   │   └── reports/      # Reports & history
│   ├── demo/             # Public demo pages (no login)
│   ├── api/              # API routes (incl. /api/chat streaming)
│   └── layout.tsx        # Root layout
├── components/
│   ├── chat/             # Shasthya Bondhu chatbot widget
│   ├── features/         # Per-agent feature components
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── supabase/         # Supabase clients (client & server)
│   ├── ai/               # AI service wrappers
│   │   ├── gemini.ts     # Gemini 3.5 Flash (key-pool rotation)
│   │   ├── groq.ts       # Groq GPT-OSS-120B (JSON pipeline)
│   │   ├── openrouter.ts # OpenRouter fallback
│   │   ├── chat.ts       # Chatbot streaming helpers
│   │   └── orchestrator.ts
│   ├── services/         # Business logic (drug mapping, interactions, calories)
│   └── utils.ts
├── supabase/             # schema, seed, migrations 001-003
├── types/                # TypeScript types
├── public/               # SW, PWA icons, TF.js model, Tesseract langs
└── vercel.json           # 60s maxDuration for API routes
```

## Available Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
- `npm run type-check` — TypeScript type check

## Deployment

Deploy to Vercel:
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## License

MIT License — Built for AUST CSE Carnival 8.0 (Project Showcase)