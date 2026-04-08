import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000 // 8 hours
const IS_DEV = process.env.NODE_ENV === 'development'

export async function proxy(request: NextRequest) {
  // In development, allow direct access to all routes without auth
  if (IS_DEV) return NextResponse.next({ request })

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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
    }
  )

  // Refresh session — must always call getUser() to keep session alive
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  // Helper: redirect while preserving any refreshed session cookies
  function redirectTo(pathname: string, params?: Record<string, string>) {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    }
    const res = NextResponse.redirect(url)
    // Copy refreshed Supabase session cookies onto the redirect response
    supabaseResponse.cookies.getAll().forEach(cookie =>
      res.cookies.set(cookie.name, cookie.value, cookie)
    )
    return res
  }

  if (!user) {
    if (!isAuthRoute && !isApiRoute) {
      return redirectTo('/login')
    }
    // Clear stale session_started cookie if present
    supabaseResponse.cookies.delete('session_started')
    return supabaseResponse
  }

  // ── Authenticated user below ──────────────────────────────────────────────

  // Enforce 8-hour session max age
  const sessionStarted = request.cookies.get('session_started')?.value
  const now = Date.now()

  if (!sessionStarted) {
    // First request after login — stamp the session start time
    supabaseResponse.cookies.set('session_started', String(now), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_MS / 1000,
    })
  } else if (now - Number(sessionStarted) > SESSION_MAX_AGE_MS) {
    // Session older than 8 hours — sign out and redirect to login
    await supabase.auth.signOut()
    return redirectTo('/login', { reason: 'session_expired' })
  }

  // Redirect authenticated users away from the login page
  if (isAuthRoute) {
    return redirectTo('/dashboard')
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
