import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody, CreateRoleSchema } from '@/lib/validations'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('custom_roles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUserFromRequest()
  if (!admin || admin.role !== 'super_admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await parseBody(req, CreateRoleSchema)
  if (body instanceof NextResponse) return body

  const { name, description, permissions, is_active } = body

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('custom_roles')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      permissions: permissions ?? {},
      is_active,
      created_by: admin.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    adminId: admin.id, adminEmail: admin.email, adminRole: admin.role,
    action: AUDIT_ACTIONS.ROLE_CREATE, entityType: 'custom_role', entityId: data.id,
    newValue: { name, permissions }, request: req,
  })

  return NextResponse.json(data, { status: 201 })
}
