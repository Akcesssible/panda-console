import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'

export async function PATCH(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { key, value } = await request.json()
  if (!key || value === undefined) return NextResponse.json({ error: 'key and value required' }, { status: 400 })

  const supabase = createAdminClient()

  // Fetch old value before updating
  const { data: existing } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', key)
    .single()

  const { error } = await supabase
    .from('system_config')
    .update({ value, updated_by: adminUser.id, updated_at: new Date().toISOString() })
    .eq('key', key)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.CONFIG_UPDATE, entityType: 'system_config', entityId: key,
    oldValue: existing ? { key, value: existing.value } : undefined,
    newValue: { key, value }, request,
  })

  return NextResponse.json({ success: true })
}
