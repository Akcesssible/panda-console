import { NextResponse } from 'next/server'
import { getAdminUserFromRequest } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody, CreateRoleSchema } from '@/lib/validations'
import { NextRequest } from 'next/server'

export async function GET() {
  return NextResponse.json([])
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUserFromRequest()
  if (!admin || admin.role !== 'super_admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await parseBody(req, CreateRoleSchema)
  if (body instanceof NextResponse) return body

  const { name, description, permissions, is_active } = body

  logAdminAction({
    adminId: admin.id, adminEmail: admin.email, adminRole: admin.role,
    action: AUDIT_ACTIONS.ROLE_CREATE, entityType: 'custom_role', entityId: undefined,
    newValue: { name, permissions }, request: req,
  }).catch(err => console.error('[roles] audit failed', err))

  return NextResponse.json({
    id: crypto.randomUUID(),
    name: name.trim(),
    description: description?.trim() || null,
    permissions: permissions ?? {},
    is_active: is_active ?? true,
  }, { status: 201 })
}
