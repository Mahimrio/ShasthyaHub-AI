# Next.js 15 App Router — Agent Skill

## Server vs Client Component Decision Tree

ALWAYS start as Server Component. Only add 'use client' if you need:
- useState, useEffect, useRef, useContext
- Browser APIs (window, document, navigator)
- Event listeners (onClick, onChange on user actions)
- Third-party client-only libraries (framer-motion components, recharts)

NEVER add 'use client' for:
- Fetching data (use async Server Components instead)
- Accessing Supabase (use server client in Server Components)
- Reading environment variables (fine in server code)
- Static rendering

## API Route Pattern (route.ts)

Every API route file must follow this exact structure:

```typescript
// app/api/feature/action/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const maxDuration = 60 // Required for AI calls that take > 10s

export async function POST(request: NextRequest) {
  try {
    // 1. Auth — always first
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse input
    const body = await request.json() // or request.formData() for files

    // 3. Validate input with Zod
    const parsed = MySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    // 4. Business logic
    const result = await myService(parsed.data, user.id, supabase)

    // 5. Return
    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('[route/feature/action]', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
```

## Middleware Auth Pattern

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => request.cookies.get(n)?.value, set: (n,v,o) => { response.cookies.set(n,v,o) }, remove: (n,o) => { response.cookies.set(n,'',o) } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const isDashboard = request.nextUrl.pathname.startsWith('/nayan-ai') ||
    request.nextUrl.pathname.startsWith('/scriptguard') ||
    request.nextUrl.pathname.startsWith('/glycovision') ||
    request.nextUrl.pathname.startsWith('/reports')
  if (isDashboard && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return response
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|demo|api/health).*)'] }
```

## Data Fetching Rules

- Server Component + async fetch = for initial page data (fastest)
- TanStack Query useQuery = for client-side data that changes (polling, user actions)
- Never useEffect + fetch = this is the old pattern, replace with TanStack Query
- Supabase realtime subscriptions = only for live updates

## Loading States

Every route segment should have loading.tsx:
```typescript
// app/(dashboard)/nayan-ai/loading.tsx
export default function Loading() {
  return <AnalysisLoadingSkeleton /> // from components/shared/
}
```

## Common Mistakes to Avoid

- DO NOT put 'use client' at the top of page.tsx — keep pages as Server Components
- DO NOT fetch in useEffect — use TanStack Query or Server Components
- DO NOT import server-only modules in client components (will cause build errors)
- DO NOT use process.env.SECRET_KEY in client components (exposes secrets)
- ALWAYS export const maxDuration = 60 in API routes that call AI APIs