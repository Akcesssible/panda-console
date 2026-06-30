import { jwtVerify, decodeJwt } from 'jose'
import type { AdminJwtClaims } from '@/lib/api/types'

// Name of the httpOnly cookie holding the backend-issued admin JWT.
export const JWT_COOKIE = 'panda_jwt'

// Edge-compatible (jose) — usable from both middleware and server components.
// The secret MUST match the backend's app.jwt.secret (JWT_SECRET env).
function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return new TextEncoder().encode(secret)
}

// Verify signature + expiry. Returns the claims, or null if invalid/expired.
// Note: this does NOT check the backend's Redis revocation list — a logged-out
// token stays signature-valid until expiry. Revocation is enforced backend-side
// (the next API call returns 401), which the client handles.
export async function verifyJwt(token: string | undefined): Promise<AdminJwtClaims | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS512'] })
    return payload as unknown as AdminJwtClaims
  } catch {
    return null
  }
}

// Decode without verifying — only for reading non-sensitive claims when the
// token has already been verified upstream. Returns null on malformed input.
export function decodeClaims(token: string | undefined): AdminJwtClaims | null {
  if (!token) return null
  try {
    return decodeJwt(token) as unknown as AdminJwtClaims
  } catch {
    return null
  }
}
