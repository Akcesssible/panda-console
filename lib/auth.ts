import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { JWT_COOKIE, verifyJwt } from '@/lib/api/jwt'
import { toUiRole } from '@/lib/api/adapters/roles'
import type { AdminUser, AdminRole } from '@/lib/types'

// Build an AdminUser from verified JWT claims. The JWT carries id, role,
// sub_name (email), and mcp — but not full_name / is_active / timestamps.
// Those are filled with sensible defaults; a backend GET /api/v1/admin/me
// endpoint (gap) would let us populate the full profile.
async function adminFromCookie(): Promise<{ user: AdminUser; mcp: boolean } | null> {
  const store = await cookies()
  const token = store.get(JWT_COOKIE)?.value
  const claims = await verifyJwt(token)
  if (!claims) return null

  const user: AdminUser = {
    id: claims.sub,
    auth_id: null,
    full_name: claims.sub_name,
    email: claims.sub_name,
    role: toUiRole(claims.role),
    is_active: true,
    created_at: '',
    updated_at: '',
  }
  return { user, mcp: claims.mcp }
}

// Get authenticated admin user — redirects if not authed.
// Middleware (proxy.ts) is the first guard; this re-verifies the JWT for
// server components and exposes the decoded profile.
export async function getAdminUser(): Promise<AdminUser> {
  const result = await adminFromCookie()
  if (!result) redirect('/login')
  if (result.mcp) redirect('/set-password')
  return result.user
}

// Use in API routes / server actions — returns null instead of redirecting.
export async function getAdminUserFromRequest(): Promise<AdminUser | null> {
  const result = await adminFromCookie()
  if (!result || result.mcp) return null
  return result.user
}

// Role guard — call before mutations.
export function requireRole(adminUser: AdminUser, roles: AdminRole[]): void {
  if (!roles.includes(adminUser.role)) {
    throw new Error('FORBIDDEN')
  }
}
