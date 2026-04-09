/**
 * In-memory sliding-window rate limiter.
 *
 * Works perfectly for a single-server / local setup.
 * For multi-instance production (e.g. Vercel serverless), swap the Map store
 * for a Redis-backed solution like @upstash/ratelimit.
 */

interface WindowRecord {
  count: number
  resetAt: number // epoch ms
}

// Module-level store — lives for the lifetime of the Node.js process
const store = new Map<string, WindowRecord>()

// Sweep expired entries every 5 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of store.entries()) {
    if (record.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

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

export function rateLimit(
  /** Unique key per client+bucket, e.g. "1.2.3.4:mutations" */
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now()
  const windowMs = options.windowSeconds * 1000

  const existing = store.get(key)

  if (!existing || existing.resetAt < now) {
    // Start a fresh window
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: options.limit - 1, resetAt: Math.ceil(resetAt / 1000) }
  }

  if (existing.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: Math.ceil(existing.resetAt / 1000) }
  }

  existing.count++
  return {
    allowed: true,
    remaining: options.limit - existing.count,
    resetAt: Math.ceil(existing.resetAt / 1000),
  }
}

// ── Pre-defined buckets ───────────────────────────────────────────────────────

/** Strict limit for auth-related endpoints */
export const AUTH_LIMIT: RateLimitOptions = { limit: 10, windowSeconds: 60 }

/** Moderate limit for write operations (POST / PATCH / DELETE) */
export const MUTATION_LIMIT: RateLimitOptions = { limit: 40, windowSeconds: 60 }

/** Relaxed limit for read operations (GET) */
export const READ_LIMIT: RateLimitOptions = { limit: 120, windowSeconds: 60 }
