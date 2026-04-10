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
  // The SSR client reads the session cookie, silently refreshes it when it's
  // close to expiry, and writes the updated cookie back to the response.
  // This MUST run on every request — otherwise sessions silently expire and
  // users get booted back to /login mid-session.

  let response = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write updated cookies back to both the request (for downstream
          // server components) and the response (for the browser).
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          response = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() also triggers the silent token refresh inside the SSR client.
  // IMPORTANT: always use getUser() here, never getSession() — getSession()
  // trusts the local cookie without re-validating with Supabase Auth server.
  const { data: { user } } = await supabase.auth.getUser()

  // ── 2. Route protection ──────────────────────────────────────────────────

  const isPublic = PUBLIC_PATHS.has(pathname)

  if (!user && !isPublic) {
    // Unauthenticated request to a protected route → send to login
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    return NextResponse.redirect(loginUrl)
  }

  if (user && pathname === '/login') {
    // Already authenticated → skip the login page
    const dashboardUrl = req.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  // ── 3. Rate limiting (API routes only) ───────────────────────────────────

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
    /*
     * Run on all paths EXCEPT Next.js internals and static assets.
     * Static files don't need session refresh or auth checks.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
