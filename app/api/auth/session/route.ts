import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'

// Called by LoginForm immediately after a successful signInWithPassword().
// Transitions the user's status (invited → active, logged_out → active)
// and writes an audit log entry for every login.
export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const isFirstLogin = adminUser.status === 'invited'

  // Only update if status needs to change (invited or logged_out → active)
  if (adminUser.status !== 'active') {
    const { error } = await supabase
      .from('admin_users')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', adminUser.id)

    if (error) {
      console.error('[session] Status update failed:', error.message)
    }
  }

  // Audit log — first login gets its own action code for easy filtering
  const action = isFirstLogin ? AUDIT_ACTIONS.ADMIN_FIRST_LOGIN : AUDIT_ACTIONS.ADMIN_LOGIN
  logAdminAction({
    adminId: adminUser.id,
    adminEmail: adminUser.email,
    adminRole: adminUser.role,
    action,
    entityType: 'admin_user',
    entityId: adminUser.id,
    oldValue: { status: adminUser.status },
    newValue: { status: 'active' },
    request,
  }).catch(err => console.error('[session] Audit log failed:', err))

  return NextResponse.json({ ok: true, first_login: isFirstLogin })
}
