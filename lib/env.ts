/**
 * Validated, typed environment variables.
 *
 * Import from here instead of reading `process.env` directly so that missing
 * variables are caught at server startup with a clear error, not silently at
 * the moment the variable is first used.
 *
 * Usage:
 *   import { env } from '@/lib/env'
 *   const url = env.NEXT_PUBLIC_APP_URL
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${name}\n` +
      `  Copy .env.example → .env.local and set ${name}.`
    )
  }
  return value
}

export const env = {
  // ── Public (available on both server and client) ──────────────────────────
  NEXT_PUBLIC_APP_URL:                required('NEXT_PUBLIC_APP_URL'),
  NEXT_PUBLIC_SUPABASE_URL:           required('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: required('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),

  // ── Server-only ───────────────────────────────────────────────────────────
  SUPABASE_SECRET_KEY:  required('SUPABASE_SECRET_KEY'),
  RESEND_API_KEY:       required('RESEND_API_KEY'),
} as const
