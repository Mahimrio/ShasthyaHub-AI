import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || !/^https?:\/\//.test(supabaseUrl)) {
    console.warn('[middleware] Supabase env vars missing or invalid — skipping auth')
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user ?? null

    const isDashboard =
      request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname.startsWith('/nayan-ai') ||
      request.nextUrl.pathname.startsWith('/scriptguard') ||
      request.nextUrl.pathname.startsWith('/glycovision') ||
      request.nextUrl.pathname.startsWith('/reports')

    const isAuthPage =
      request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/register'

    if (isDashboard && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (isAuthPage && user) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error('[middleware] Supabase auth check failed:', error)
  }

  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set('Permissions-Policy', 'camera=self, microphone=self')

  supabaseResponse.headers.set(
    'Content-Security-Policy',
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' 'unsafe-eval'; worker-src 'self' blob:;"
  )

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|demo|api/health).*)',
  ],
}
