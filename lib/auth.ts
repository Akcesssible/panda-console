import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { AdminUser, AdminRole } from '@/lib/types'

const DEV_ADMIN: AdminUser = {
  id: '00000000-0000-0000-0000-000000000001',
  auth_id: '00000000-0000-0000-0000-000000000001',
  full_name: 'Dev Admin',
  email: 'dev@pandahailing.com',
  role: 'super_admin',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// Get authenticated admin user — redirects to /login if not authed
export async function getAdminUser(): Promise<AdminUser> {
  if (process.env.NODE_ENV === 'development') return DEV_ADMIN

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
  if (!data.is_active) redirect('/login')

  return data as AdminUser
}

// Use in API routes — returns null instead of redirecting
export async function getAdminUserFromRequest(): Promise<AdminUser | null> {
  if (process.env.NODE_ENV === 'development') return DEV_ADMIN

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
