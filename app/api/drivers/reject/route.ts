import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { driver_id, reason } = await request.json()
  if (!driver_id || !reason) return NextResponse.json({ error: 'driver_id and reason required' }, { status: 400 })

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('drivers')
    .update({
      status: 'suspended',
      suspended_reason: `REJECTED: ${reason}`,
      suspended_by: adminUser.id,
      suspended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', driver_id)
    .eq('status', 'pending')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.DRIVER_REJECT,
    entityType: 'driver', entityId: driver_id,
    oldValue: { status: 'pending' },
    newValue: { status: 'pending', rejected: true, reason },
    request,
  })

  return NextResponse.json({ success: true })
}
