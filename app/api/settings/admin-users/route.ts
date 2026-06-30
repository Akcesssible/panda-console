import { NextResponse } from 'next/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody, InviteAdminUserSchema } from '@/lib/validations'
import { api } from '@/lib/api/client'
import { paths } from '@/lib/api/paths'
import { toUiRole, toBackendRole } from '@/lib/api/adapters'
import type { BackendAdminUser } from '@/lib/api/types'

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

export async function GET() {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  try {
    const users = await api.get<BackendAdminUser[]>(paths.adminUsers)
    return NextResponse.json({ users: (users ?? []).map(toPortalUser) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch users'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await parseBody(request, InviteAdminUserSchema)
  if (body instanceof NextResponse) return body

  const { email, full_name, role } = body

  try {
    const created = await api.post<BackendAdminUser>(paths.adminUsers, {
      fullName: full_name,
      email,
      role: toBackendRole(role),
    })

    logAdminAction({
      adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
      action: AUDIT_ACTIONS.ADMIN_CREATE, entityType: 'admin_user', entityId: created?.id,
      newValue: { email, full_name, role }, request,
    }).catch(err => console.error('[admin-users] audit failed', err))

    return NextResponse.json({ user: toPortalUser(created), email_sent: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
