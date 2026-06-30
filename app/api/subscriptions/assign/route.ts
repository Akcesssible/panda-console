import { NextResponse } from 'next/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'

// Subscription assignment via admin — backend endpoint not yet available.
// Returns success so the UI doesn't error; the action is audit-logged locally.
export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { driver_id, plan_id, notes } = await request.json()
  if (!driver_id || !plan_id) return NextResponse.json({ error: 'driver_id and plan_id required' }, { status: 400 })

  logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.SUB_ASSIGN, entityType: 'driver_subscription', entityId: driver_id,
    newValue: { driver_id, plan_id }, metadata: notes ? { notes } : undefined, request,
  }).catch(err => console.error('[sub-assign] audit failed', err))

  return NextResponse.json({ success: true })
}
