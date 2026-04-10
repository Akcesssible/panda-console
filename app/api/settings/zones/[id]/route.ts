import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { id } = await params
  const body = await request.json()

  const supabase = createAdminClient()

  // Fetch old value before updating
  const { data: existing } = await supabase
    .from('zones')
    .select('name, is_active, base_fare_tzs, per_km_tzs, per_minute_tzs')
    .eq('id', id)
    .single()

  const { data, error } = await supabase.from('zones').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.ZONE_UPDATE, entityType: 'zone', entityId: id,
    oldValue: existing ?? undefined,
    newValue: body, request,
  })

  return NextResponse.json({ zone: data })
}
