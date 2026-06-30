import { NextResponse } from 'next/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody, DriverFlagSchema } from '@/lib/validations'
import { api } from '@/lib/api/client'
import { paths } from '@/lib/api/paths'
import { toDriver } from '@/lib/api/adapters'
import type { BackendDriverProfile } from '@/lib/api/types'
import { ApiError } from '@/lib/api/errors'

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await parseBody(request, DriverFlagSchema)
  if (body instanceof NextResponse) return body

  const { driver_id, reason } = body

  try {
    const profile = await api.post<BackendDriverProfile>(paths.driverReject(driver_id), { reason })
    const driver = toDriver(profile)

    logAdminAction({
      adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
      action: AUDIT_ACTIONS.DRIVER_REJECT, entityType: 'driver', entityId: driver_id,
      newValue: { rejected: true, reason }, request,
    }).catch(err => console.error('[reject] audit failed', err))

    return NextResponse.json({ success: true, driver })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to reject driver'
    const status = err instanceof ApiError ? err.status : 500
    return NextResponse.json({ error: message }, { status })
  }
}
