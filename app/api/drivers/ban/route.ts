import { NextResponse } from 'next/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody, DriverReasonSchema } from '@/lib/validations'
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

  const body = await parseBody(request, DriverReasonSchema)
  if (body instanceof NextResponse) return body

  const { driver_id, reason } = body

  try {
    const profile = await api.post<BackendDriverProfile>(paths.driverSuspend(driver_id), { reason })
    const driver = toDriver(profile)
    const admin = createAdminClient()
    const now = new Date().toISOString()

    await admin
      .from('drivers')
      .upsert({
        id: driver_id,
        driver_number: driver.driver_number,
        full_name: driver.full_name,
        phone: driver.phone,
        email: driver.email,
        status: 'suspended',
        suspended_reason: reason,
        suspended_at: now,
        suspended_by: adminUser.id,
        banned_reason: reason,
        banned_at: now,
        banned_by: adminUser.id,
        updated_at: now,
      })

    logAdminAction({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      adminRole: adminUser.role,
      action: AUDIT_ACTIONS.DRIVER_BAN,
      entityType: 'driver',
      entityId: driver_id,
      newValue: { status: 'banned', reason },
      request,
    }).catch(err => console.error('[ban] audit failed', err))

    return NextResponse.json({
      success: true,
      driver: {
        ...driver,
        status: 'banned',
        banned_reason: reason,
        banned_at: now,
        banned_by: adminUser.id,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to ban driver'
    const status = err instanceof ApiError ? err.status : 500
    return NextResponse.json({ error: message }, { status })
  }
}
