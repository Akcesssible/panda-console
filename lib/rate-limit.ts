/**
 * Rate limiter.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * are set (production / Vercel). Falls back to an in-memory sliding window
 * for local development where those env vars are absent.
 *
 * Setup for production:
 *   1. Create a free Redis database at console.upstash.com
 *   2. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env.local
 *      (and to the Vercel project's environment variables).
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis }     from '@upstash/redis'

export interface RateLimitOptions {
  /** Maximum requests allowed in the window */
  limit: number
  /** Window length in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  /** Unix timestamp (seconds) when the window resets */
  resetAt: number
}

// ── Pre-defined buckets ───────────────────────────────────────────────────────

/** Strict limit for auth-related endpoints */
export const AUTH_LIMIT: RateLimitOptions     = { limit: 10,  windowSeconds: 60 }
/** Moderate limit for write operations (POST / PATCH / DELETE) */
export const MUTATION_LIMIT: RateLimitOptions = { limit: 40,  windowSeconds: 60 }
/** Relaxed limit for read operations (GET) */
export const READ_LIMIT: RateLimitOptions     = { limit: 120, windowSeconds: 60 }

// ── Upstash Redis limiters (created once, reused across requests) ─────────────

let authLimiter:  Ratelimit | null = null
let writeLimiter: Ratelimit | null = null
let readLimiter:  Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  authLimiter  = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(AUTH_LIMIT.limit,     `${AUTH_LIMIT.windowSeconds} s`),     prefix: '@panda/auth'  })
  writeLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(MUTATION_LIMIT.limit, `${MUTATION_LIMIT.windowSeconds} s`), prefix: '@panda/write' })
  readLimiter  = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(READ_LIMIT.limit,     `${READ_LIMIT.windowSeconds} s`),     prefix: '@panda/read'  })
}

// ── In-memory fallback (local dev, single-process only) ───────────────────────

interface WindowRecord { count: number; resetAt: number }
const store = new Map<string, WindowRecord>()

// Sweep expired entries — guarded so it doesn't throw in Edge runtime
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, record] of store.entries()) {
      if (record.resetAt < now) store.delete(key)
    }
  }, 5 * 60 * 1000)
  // Don't block process exit in Node.js
  if (typeof timer === 'object' && timer !== null && 'unref' in timer) {
    (timer as NodeJS.Timeout).unref()
  }
}

function inMemoryLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now      = Date.now()
  const windowMs = options.windowSeconds * 1000
  const existing = store.get(key)

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: options.limit - 1, resetAt: Math.ceil(resetAt / 1000) }
  }

  if (existing.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: Math.ceil(existing.resetAt / 1000) }
  }

  existing.count++
  return {
    allowed:   true,
    remaining: options.limit - existing.count,
    resetAt:   Math.ceil(existing.resetAt / 1000),
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function rateLimit(
  /** Unique key per client + bucket, e.g. "1.2.3.4:auth" */
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  // Pick the Upstash limiter that matches this bucket's limit
  const limiter =
    options.limit === AUTH_LIMIT.limit     ? authLimiter  :
    options.limit === MUTATION_LIMIT.limit ? writeLimiter :
                                             readLimiter

  if (limiter) {
    const { success, remaining, reset } = await limiter.limit(key)
    return {
      allowed:   success,
      remaining,
      // Upstash reset is in milliseconds
      resetAt: Math.ceil(reset / 1000),
    }
  }

  // No Upstash configured — use in-memory fallback
  return inMemoryLimit(key, options)
}
