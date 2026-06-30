import { NextResponse } from 'next/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody, DriverFlagSchema } from '@/lib/validations'

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try { requireRole(adminUser, ['super_admin', 'ops_admin', 'support_agent']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await parseBody(request, DriverFlagSchema)
  if (body instanceof NextResponse) return body

  const { driver_id, reason: flag_reason } = body

  logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.DRIVER_FLAG,
    entityType: 'driver', entityId: driver_id,
    metadata: { flag_reason },
    request,
  }).catch(err => console.error('[flag] audit failed', err))

  return NextResponse.json({ success: true })
}
