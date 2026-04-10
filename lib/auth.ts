import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { AdminUser, AdminRole } from '@/lib/types'

// Get authenticated admin user — redirects to /login if not authed or inactive.
// The proxy already blocks unauthenticated page requests; this is a second
// guard that also verifies the user exists in admin_users and is active.
export async function getAdminUser(): Promise<AdminUser> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('admin_users')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  if (error || !data) redirect('/login')
  if (!data.is_active) redirect('/login?reason=deactivated')

  return data as AdminUser
}

// Use in API routes — returns null instead of redirecting.
export async function getAdminUserFromRequest(): Promise<AdminUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('admin_users')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  if (!data || !data.is_active) return null
  return data as AdminUser
}

// Role guard — call in API routes before mutations
export function requireRole(adminUser: AdminUser, roles: AdminRole[]): void {
  if (!roles.includes(adminUser.role)) {
    throw new Error('FORBIDDEN')
  }
}
