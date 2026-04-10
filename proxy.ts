import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { rateLimit, AUTH_LIMIT, MUTATION_LIMIT, READ_LIMIT } from '@/lib/rate-limit'

// NOTE: do NOT set `export const runtime` here — not allowed in proxy files.

// Paths that don't require a logged-in session
const PUBLIC_PATHS = new Set(['/login', '/set-password'])

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── 1. Session refresh via Supabase SSR ──────────────────────────────────
  // Collect any cookies the SSR client wants to set during token refresh.
  // We apply them to the final response after building it below.
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Accumulate rather than building a response here — we build once
          // below so we can also inject x-auth-user-id in the same call.
          pendingCookies.push(...cookiesToSet as typeof pendingCookies)
        },
      },
    }
  )

  // getUser() validates the token server-side AND triggers silent refresh.
  // IMPORTANT: always use getUser(), never getSession() — getSession() trusts
  // the local cookie without re-validating with the Supabase Auth server.
  const { data: { user } } = await supabase.auth.getUser()

  // ── 2. Build the forwarded request headers ───────────────────────────────
  // Strip any client-supplied x-auth-user-id (security), then set the
  // authoritative value from our validated getUser() result.
  // Server components read this header via next/headers to skip their own
  // getUser() call, cutting one full Supabase Auth round trip per page load.
  const requestHeaders = new Headers(req.headers)
  requestHeaders.delete('x-auth-user-id')           // never trust the client
  if (user) {
    requestHeaders.set('x-auth-user-id', user.id)
  }

  // Build the final response — one allocation, carries both the modified
  // request headers (for server components) and the session cookies (for
  // the browser) accumulated above.
  let response = NextResponse.next({ request: { headers: requestHeaders } })
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  )

  // ── 3. Route protection ──────────────────────────────────────────────────
  const isPublic = PUBLIC_PATHS.has(pathname)

  if (!user && !isPublic) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    return NextResponse.redirect(loginUrl)
  }

  if (user && pathname === '/login') {
    const dashboardUrl = req.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  // ── 4. No-cache headers on protected pages ───────────────────────────────
  // Prevents the browser from serving a cached copy after logout.
  if (!isPublic && !pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  // ── 5. Rate limiting (API routes only) ───────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const ip = getClientIP(req)
    const isAuth  = pathname.startsWith('/api/auth')
    const isWrite = WRITE_METHODS.has(req.method)

    const bucket  = isAuth ? 'auth' : isWrite ? 'write' : 'read'
    const options = isAuth ? AUTH_LIMIT : isWrite ? MUTATION_LIMIT : READ_LIMIT

    const result = rateLimit(`${ip}:${bucket}`, options)

    if (!result.allowed) {
      const limited = NextResponse.json(
        { error: 'Too many requests — please slow down and try again shortly.' },
        { status: 429 },
      )
      limited.headers.set('X-RateLimit-Limit',     String(options.limit))
      limited.headers.set('X-RateLimit-Remaining', String(result.remaining))
      limited.headers.set('X-RateLimit-Reset',     String(result.resetAt))
      limited.headers.set('Retry-After', String(result.resetAt - Math.ceil(Date.now() / 1000)))
      return limited
    }

    response.headers.set('X-RateLimit-Limit',     String(options.limit))
    response.headers.set('X-RateLimit-Remaining', String(result.remaining))
    response.headers.set('X-RateLimit-Reset',     String(result.resetAt))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
