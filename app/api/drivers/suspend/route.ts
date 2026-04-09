import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody, DriverFlagSchema } from '@/lib/validations'

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await parseBody(request, DriverFlagSchema)
  if (body instanceof NextResponse) return body

  const { driver_id, reason } = body

  const supabase = createAdminClient()

  const { data: old } = await supabase.from('drivers').select('status').eq('id', driver_id).single()

  const { data: updated, error } = await supabase
    .from('drivers')
    .update({
      status: 'suspended',
      suspended_reason: reason,
      suspended_by: adminUser.id,
      suspended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', driver_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.DRIVER_SUSPEND,
    entityType: 'driver', entityId: driver_id,
    oldValue: { status: old?.status },
    newValue: { status: 'suspended', reason },
    request,
  })

  return NextResponse.json({ success: true, driver: updated })
}
