import { NextResponse } from 'next/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody, DriverActionSchema } from '@/lib/validations'
import { api } from '@/lib/api/client'
import { paths } from '@/lib/api/paths'
import { toDriver } from '@/lib/api/adapters'
import { createAdminClient } from '@/lib/supabase/server'
import type { BackendDriverProfile } from '@/lib/api/types'
import { ApiError } from '@/lib/api/errors'

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await parseBody(request, DriverActionSchema)
  if (body instanceof NextResponse) return body

  const { driver_id, notes } = body

  try {
    const profile = await api.post<BackendDriverProfile>(paths.driverReactivate(driver_id))
    const driver = toDriver(profile)
    const admin = createAdminClient()

    await admin
      .from('drivers')
      .update({
        status: 'active',
        suspended_reason: null,
        suspended_at: null,
        suspended_by: null,
        banned_reason: null,
        banned_at: null,
        banned_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', driver_id)

    logAdminAction({
      adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
      action: AUDIT_ACTIONS.DRIVER_REACTIVATE, entityType: 'driver', entityId: driver_id,
      newValue: { status: 'active' }, metadata: notes ? { notes } : undefined, request,
    }).catch(err => console.error('[reactivate] audit failed', err))

    return NextResponse.json({ success: true, driver })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to reactivate driver'
    const status = err instanceof ApiError ? err.status : 500
    return NextResponse.json({ error: message }, { status })
  }
}
