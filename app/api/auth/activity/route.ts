import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'

// POST /api/auth/activity
// Called client-side after login and before logout.
// Updates the admin_users.status column and writes an audit log entry.
// Body: { event: 'login' | 'logout' }
export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const event = body?.event as string | undefined

  if (event !== 'login' && event !== 'logout') {
    return NextResponse.json({ error: 'event must be "login" or "logout"' }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (event === 'login') {
    const isFirstLogin = adminUser.status === 'invited'
    const newStatus    = 'active'

    await supabase
      .from('admin_users')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', adminUser.id)

    await logAdminAction({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      adminRole: adminUser.role,
      action: isFirstLogin ? AUDIT_ACTIONS.ADMIN_FIRST_LOGIN : AUDIT_ACTIONS.ADMIN_LOGIN,
      entityType: 'admin_user',
      entityId: adminUser.id,
      oldValue: { status: adminUser.status },
      newValue: { status: newStatus },
      metadata: { first_login: isFirstLogin },
      request,
    })

    return NextResponse.json({ ok: true, status: newStatus, first_login: isFirstLogin })
  }

  // event === 'logout'
  const newStatus = 'logged_out'

  await supabase
    .from('admin_users')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', adminUser.id)

  await logAdminAction({
    adminId: adminUser.id,
    adminEmail: adminUser.email,
    adminRole: adminUser.role,
    action: AUDIT_ACTIONS.ADMIN_LOGOUT,
    entityType: 'admin_user',
    entityId: adminUser.id,
    oldValue: { status: adminUser.status },
    newValue: { status: newStatus },
    request,
  })

  return NextResponse.json({ ok: true, status: newStatus })
}
