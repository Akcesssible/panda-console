import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, AUTH_LIMIT, MUTATION_LIMIT, READ_LIMIT } from '@/lib/rate-limit'
import { JWT_COOKIE, verifyJwt } from '@/lib/api/jwt'

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

  // ── 1. Authenticate via the backend-issued JWT cookie ────────────────────
  // Verify signature + expiry locally (jose, Edge-compatible). Revocation is
  // enforced backend-side — a logged-out token still verifies here until expiry,
  // but the next backend call returns 401 and the client clears the cookie.
  const token = req.cookies.get(JWT_COOKIE)?.value
  const claims = await verifyJwt(token)
  const isAuthed = !!claims
  const mustChangePassword = claims?.mcp ?? false

  const isPublic = PUBLIC_PATHS.has(pathname)

  // ── 2. Route protection ──────────────────────────────────────────────────
  if (!isAuthed && !isPublic) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    return NextResponse.redirect(loginUrl)
  }

  // Temp-password admins must set a new password before reaching the app.
  if (isAuthed && mustChangePassword && pathname !== '/set-password' && !pathname.startsWith('/api/')) {
    const setPwUrl = req.nextUrl.clone()
    setPwUrl.pathname = '/set-password'
    setPwUrl.search = ''
    return NextResponse.redirect(setPwUrl)
  }

  // Already authed (and not mid-password-change) — keep them out of auth pages.
  if (isAuthed && !mustChangePassword && (pathname === '/login' || pathname === '/set-password')) {
    const dashboardUrl = req.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    dashboardUrl.search = ''
    return NextResponse.redirect(dashboardUrl)
  }

  const response = NextResponse.next()

  // ── 3. No-cache headers on protected pages ───────────────────────────────
  if (!isPublic && !pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  // ── 4. Rate limiting (API routes only) ───────────────────────────────────
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
