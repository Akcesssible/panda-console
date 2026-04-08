import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    requireRole(adminUser, ['super_admin', 'ops_admin'])
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { driver_id, notes } = await request.json()
  if (!driver_id) return NextResponse.json({ error: 'driver_id is required' }, { status: 400 })

  const supabase = createAdminClient()

  // Get current driver state for audit
  const { data: driver } = await supabase.from('drivers').select('status').eq('id', driver_id).single()
  if (!driver) return NextResponse.json({ error: 'Driver not found' }, { status: 404 })

  // Approve
  const { data: updated, error } = await supabase
    .from('drivers')
    .update({
      status: 'active',
      approved_by: adminUser.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', driver_id)
    .eq('status', 'pending')
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!updated) return NextResponse.json({ error: 'Driver not pending' }, { status: 400 })

  await logAdminAction({
    adminId: adminUser.id,
    adminEmail: adminUser.email,
    adminRole: adminUser.role,
    action: AUDIT_ACTIONS.DRIVER_APPROVE,
    entityType: 'driver',
    entityId: driver_id,
    oldValue: { status: 'pending' },
    newValue: { status: 'active' },
    metadata: notes ? { notes } : undefined,
    request,
  })

  return NextResponse.json({ success: true, driver: updated })
}
