import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { id } = await params
  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.role !== undefined) updates.role = body.role
  if (body.is_active !== undefined) updates.is_active = body.is_active
  updates.updated_at = new Date().toISOString()

  const supabase = createAdminClient()

  // Fetch old value before updating
  const { data: existing } = await supabase
    .from('admin_users')
    .select('role, is_active, full_name, email')
    .eq('id', id)
    .single()

  const { data, error } = await supabase.from('admin_users').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const action = body.role !== undefined ? AUDIT_ACTIONS.ADMIN_ROLE_CHANGE
    : body.is_active === false ? AUDIT_ACTIONS.ADMIN_DEACTIVATE
    : AUDIT_ACTIONS.ADMIN_UPDATE

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action, entityType: 'admin_user', entityId: id,
    oldValue: existing ?? undefined,
    newValue: updates, request,
  })

  return NextResponse.json({ user: data })
}
