import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'

// Called by Sidebar handleLogout() before supabase.auth.signOut().
// Transitions status to 'logged_out' and writes the audit log.
// Must be called while the session cookie is still valid (before signOut).
export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('admin_users')
    .update({ status: 'logged_out', updated_at: new Date().toISOString() })
    .eq('id', adminUser.id)

  if (error) {
    console.error('[logout] Status update failed:', error.message)
  }

  logAdminAction({
    adminId: adminUser.id,
    adminEmail: adminUser.email,
    adminRole: adminUser.role,
    action: AUDIT_ACTIONS.ADMIN_LOGOUT,
    entityType: 'admin_user',
    entityId: adminUser.id,
    oldValue: { status: adminUser.status },
    newValue: { status: 'logged_out' },
    request,
  }).catch(err => console.error('[logout] Audit log failed:', err))

  return NextResponse.json({ ok: true })
}
