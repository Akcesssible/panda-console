import { NextResponse } from 'next/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { api } from '@/lib/api/client'
import { paths } from '@/lib/api/paths'
import { toUiRole, toBackendRole } from '@/lib/api/adapters'
import type { BackendAdminUser } from '@/lib/api/types'
import type { AdminRole } from '@/lib/types'

function toPortalUser(u: BackendAdminUser) {
  return {
    id: u.id,
    full_name: u.fullName,
    email: u.email,
    role: toUiRole(u.role),
    is_active: u.status === 'ACTIVE',
    must_change_password: u.mustChangePassword,
    mfa_enabled: u.mfaEnabled,
    last_login_at: u.lastLoginAt,
    created_at: u.createdAt,
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { id } = await params
  const body = await request.json()

  const backendBody: Record<string, unknown> = {}
  if (body.role !== undefined) backendBody.role = toBackendRole(body.role as AdminRole)
  if (body.is_active !== undefined) backendBody.status = body.is_active ? 'ACTIVE' : 'INACTIVE'

  try {
    const updated = await api.patch<BackendAdminUser>(paths.adminUser(id), backendBody)

    const action = body.role !== undefined ? AUDIT_ACTIONS.ADMIN_ROLE_CHANGE
      : body.is_active === false ? AUDIT_ACTIONS.ADMIN_DEACTIVATE
      : AUDIT_ACTIONS.ADMIN_UPDATE

    logAdminAction({
      adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
      action, entityType: 'admin_user', entityId: id,
      newValue: backendBody, request,
    }).catch(err => console.error('[admin-users] audit failed', err))

    return NextResponse.json({ user: toPortalUser(updated) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { id } = await params

  try {
    await api.del(paths.adminUser(id))

    logAdminAction({
      adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
      action: AUDIT_ACTIONS.ADMIN_DEACTIVATE, entityType: 'admin_user', entityId: id,
      request,
    }).catch(err => console.error('[admin-users] audit failed', err))

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
