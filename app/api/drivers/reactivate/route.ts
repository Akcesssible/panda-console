import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody, DriverActionSchema } from '@/lib/validations'

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await parseBody(request, DriverActionSchema)
  if (body instanceof NextResponse) return body

  const { driver_id, notes } = body

  const supabase = createAdminClient()

  const { data: updated, error } = await supabase
    .from('drivers')
    .update({
      status: 'active',
      suspended_reason: null,
      suspended_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', driver_id)
    .eq('status', 'suspended')
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!updated) return NextResponse.json({ error: 'Driver not suspended' }, { status: 400 })

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.DRIVER_REACTIVATE,
    entityType: 'driver', entityId: driver_id,
    oldValue: { status: 'suspended' }, newValue: { status: 'active' },
    metadata: notes ? { notes } : undefined,
    request,
  })

  return NextResponse.json({ success: true, driver: updated })
}
