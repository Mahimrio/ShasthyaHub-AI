# ShasthyaHub-AI

Multi-agent AI healthcare web app for rural Bangladesh — SciBlitz AI Challenge 2026

## Team

Team ShasthyaHub

## Overview

ShasthyaHub-AI is a comprehensive healthcare platform designed for rural Bangladesh, featuring three AI-powered agents:

- **Nayan AI** — Diabetic Retinopathy Detection from retinal images
- **ScriptGuard** — Prescription Analyzer for drug interactions and safety
- **GlycoVision** — Glucose Tracker with nutrition insights

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Database & Auth**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack React Query
- **AI**: Google Gemini 1.5 Pro + Groq Llama 3.3 70B
- **Internationalization**: next-i18next (English, বাংলা)
- **PWA**: next-pwa
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
cp .env.local.example .env.local
```
Then edit `.env.local` with your API keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
USDA_API_KEY=your_usda_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Set up Supabase:
   - Create the Supabase SQL Editor.

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
shasthyahub-ai/
├── app/
│   ├── (auth)/           # Auth routes (login, register)
│   ├── (dashboard)/      # Protected dashboard routes
│   │   ├── nayan-ai/     # Diabetic retinopathy detection
│   │   ├── scriptguard/  # Prescription analyzer
│   │   ├── glycovision/  # Glucose tracker
│   │   └── reports/      # Reports & history
│   ├── demo/             # Public demo pages
│   ├── api/              # API routes
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── supabase/         # Supabase clients (client & server)
│   ├── ai/               # AI service wrappers
│   │   ├── gemini.ts     # Google Gemini 1.5 Pro
│   │   ├── groq.ts       # Groq Llama 3.3 70B
│   │   └── orchestrator.ts
│   ├── services/         # Business logic services
│   │   ├── drug-mapping.ts
│   │   ├── drug-interaction.ts
│   │   ├── calorie.ts
│   │   └── schedule.ts
│   └── utils.ts          # Utility functions
├── types/                # TypeScript types
├── public/               # Static assets
├── .env.local            # Environment variables
├── vercel.json           # Vercel configuration
└── package.json
```

## Available Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

## Deployment

Deploy to Vercel:
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## License

MIT License — Built for SciBlitz AI Challenge 2026