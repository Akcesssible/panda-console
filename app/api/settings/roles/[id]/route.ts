import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody, UpdateRoleSchema } from '@/lib/validations'
import { NextRequest, NextResponse } from 'next/server'

// These IDs are seeded as built-in roles and must never be deleted
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

  const { name, description, permissions, is_active } = body

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('custom_roles')
    .update({
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() || null } : {}),
      ...(permissions !== undefined ? { permissions } : {}),
      ...(is_active !== undefined ? { is_active } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    adminId: admin.id, adminEmail: admin.email, adminRole: admin.role,
    action: AUDIT_ACTIONS.ROLE_UPDATE, entityType: 'custom_role', entityId: id,
    newValue: { name, is_active }, request: req,
  })

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUserFromRequest()
  if (!admin || admin.role !== 'super_admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  if (BUILTIN_ROLE_IDS.has(id))
    return NextResponse.json({ error: 'Built-in roles cannot be deleted.' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase.from('custom_roles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    adminId: admin.id, adminEmail: admin.email, adminRole: admin.role,
    action: AUDIT_ACTIONS.ROLE_DELETE, entityType: 'custom_role', entityId: id,
    metadata: { action: 'deleted' }, request: req,
  })

  return NextResponse.json({ success: true })
}
