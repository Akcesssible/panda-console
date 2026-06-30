import { getAdminUserFromRequest } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody, UpdateRoleSchema } from '@/lib/validations'
import { NextRequest, NextResponse } from 'next/server'

const BUILTIN_ROLE_IDS = new Set([
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000003',
  'aaaaaaaa-0000-0000-0000-000000000004',
])

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUserFromRequest()
  if (!admin || admin.role !== 'super_admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const body = await parseBody(req, UpdateRoleSchema)
  if (body instanceof NextResponse) return body

  const { name, is_active } = body

  logAdminAction({
    adminId: admin.id, adminEmail: admin.email, adminRole: admin.role,
    action: AUDIT_ACTIONS.ROLE_UPDATE, entityType: 'custom_role', entityId: id,
    newValue: { name, is_active }, request: req,
  }).catch(err => console.error('[roles] audit failed', err))

  return NextResponse.json({ id, ...body })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUserFromRequest()
  if (!admin || admin.role !== 'super_admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  if (BUILTIN_ROLE_IDS.has(id))
    return NextResponse.json({ error: 'Built-in roles cannot be deleted.' }, { status: 400 })

  logAdminAction({
    adminId: admin.id, adminEmail: admin.email, adminRole: admin.role,
    action: AUDIT_ACTIONS.ROLE_DELETE, entityType: 'custom_role', entityId: id,
    metadata: { action: 'deleted' }, request: req,
  }).catch(err => console.error('[roles] audit failed', err))

  return NextResponse.json({ success: true })
}
