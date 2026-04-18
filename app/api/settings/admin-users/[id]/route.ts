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

  if (body.role !== undefined)      updates.role      = body.role
  if (body.is_active !== undefined) updates.is_active = body.is_active
  updates.updated_at = new Date().toISOString()

  // Keep status in sync with is_active
  if (body.is_active === false) updates.status = 'deactivated'
  if (body.is_active === true)  updates.status = 'active'

  const supabase = createAdminClient()

  // Fetch existing record — need auth_id for session revocation + old values for audit
  const { data: existing } = await supabase
    .from('admin_users')
    .select('role, is_active, status, full_name, email, auth_id')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('admin_users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Deactivating — revoke all Supabase sessions so they are kicked out immediately
  if (body.is_active === false && existing?.auth_id) {
    const { error: signOutError } = await supabase.auth.admin.signOut(
      existing.auth_id,
      'global',
    )
    if (signOutError) {
      console.error('[deactivate] Session revocation failed:', signOutError.message)
    }
  }

  const action = body.role !== undefined  ? AUDIT_ACTIONS.ADMIN_ROLE_CHANGE
               : body.is_active === false  ? AUDIT_ACTIONS.ADMIN_DEACTIVATE
               : body.is_active === true   ? AUDIT_ACTIONS.ADMIN_REACTIVATE
               : AUDIT_ACTIONS.ADMIN_UPDATE

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action, entityType: 'admin_user', entityId: id,
    oldValue: existing ?? undefined,
    newValue: updates, request,
  })

  return NextResponse.json({ user: data })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { id } = await params

  // Prevent self-deletion
  if (id === adminUser.id) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch the target user — deletion is only allowed if status = 'deactivated'
  const { data: target, error: fetchError } = await supabase
    .from('admin_users')
    .select('id, full_name, email, role, status, is_active, auth_id')
    .eq('id', id)
    .single()

  if (fetchError || !target) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  // Allow deletion if status = 'deactivated' OR is_active = false (fallback for older rows)
  const isDeactivated = target.status === 'deactivated' || target.is_active === false
  if (!isDeactivated) {
    return NextResponse.json(
      { error: 'User must be deactivated before they can be deleted.' },
      { status: 400 },
    )
  }

  // Always delete the admin_users row explicitly first — do not rely on
  // ON DELETE CASCADE, which may not be active if the migration hasn't run.
  const { error: deleteError } = await supabase.from('admin_users').delete().eq('id', id)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Also delete the auth user so they can't sign in with old credentials.
  // Fire-and-forget — if this fails the row is already gone so the user
  // is effectively removed from the system.
  if (target.auth_id) {
    await supabase.auth.admin.deleteUser(target.auth_id)
  }

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.ADMIN_DELETE,
    entityType: 'admin_user', entityId: id,
    oldValue: { full_name: target.full_name, email: target.email, role: target.role, status: target.status },
    request,
  })

  return NextResponse.json({ ok: true })
}
