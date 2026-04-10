import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { AdminUser, AdminRole } from '@/lib/types'

// The proxy (proxy.ts) calls supabase.auth.getUser() on every request and
// forwards the validated auth ID as a request header. Reading that header here
// avoids a second round trip to Supabase Auth, cutting ~1-3 s per page load.
async function getAuthUserId(): Promise<string | null> {
  const h = await headers()
  return h.get('x-auth-user-id')
}

// Fetch the admin_users record for a given Supabase auth ID.
async function fetchAdminRecord(authId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('admin_users')
    .select('*')
    .eq('auth_id', authId)
    .single()
  return { data, error }
}

// Get authenticated admin user — redirects to /login if not authed or inactive.
// Two-layer guard:
//   Layer 1 — proxy.ts: blocks requests with no Supabase session at all.
//   Layer 2 — here: verifies the user exists in admin_users and is_active.
export async function getAdminUser(): Promise<AdminUser> {
  const authId = await getAuthUserId()
  if (!authId) redirect('/login')

  const { data, error } = await fetchAdminRecord(authId)

  if (error || !data) redirect('/login')
  if (!data.is_active) redirect('/login?reason=deactivated')

  return data as AdminUser
}

// Use in API routes — returns null instead of redirecting.
export async function getAdminUserFromRequest(): Promise<AdminUser | null> {
  const authId = await getAuthUserId()
  if (!authId) return null

  const { data } = await fetchAdminRecord(authId)
  if (!data || !data.is_active) return null

  return data as AdminUser
}

// Role guard — call in API routes before mutations
export function requireRole(adminUser: AdminUser, roles: AdminRole[]): void {
  if (!roles.includes(adminUser.role)) {
    throw new Error('FORBIDDEN')
  }
}
