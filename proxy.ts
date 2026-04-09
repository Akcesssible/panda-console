import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, AUTH_LIMIT, MUTATION_LIMIT, READ_LIMIT } from '@/lib/rate-limit'

// NOTE: do NOT set `export const runtime` here — it is not allowed in proxy files.
// Proxy defaults to Node.js runtime, so the in-memory rate-limit Map persists correctly.

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith('/api/')) return NextResponse.next()

  const ip = getClientIP(req)
  const isAuth = pathname.startsWith('/api/auth')
  const isWrite = WRITE_METHODS.has(req.method)

  const bucket = isAuth ? 'auth' : isWrite ? 'write' : 'read'
  const options = isAuth ? AUTH_LIMIT : isWrite ? MUTATION_LIMIT : READ_LIMIT

  const result = rateLimit(`${ip}:${bucket}`, options)

  const response = result.allowed
    ? NextResponse.next()
    : NextResponse.json(
        { error: 'Too many requests — please slow down and try again shortly.' },
        { status: 429 },
      )

  response.headers.set('X-RateLimit-Limit', String(options.limit))
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  response.headers.set('X-RateLimit-Reset', String(result.resetAt))
  if (!result.allowed) {
    response.headers.set('Retry-After', String(result.resetAt - Math.ceil(Date.now() / 1000)))
  }

  return response
}

export const config = {
  matcher: '/api/:path*',
}
