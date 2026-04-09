import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody, InviteAdminUserSchema } from '@/lib/validations'

export async function GET() {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('admin_users').select('*').order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data })
}

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await parseBody(request, InviteAdminUserSchema)
  if (body instanceof NextResponse) return body

  const { email, full_name, role } = body

  const supabase = createAdminClient()

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: `Panda${Math.random().toString(36).slice(-8)}!`,
    email_confirm: true,
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // Create admin_users record
  const { data: user, error } = await supabase
    .from('admin_users')
    .insert({ full_name, email, role, auth_id: authData.user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.ADMIN_CREATE, entityType: 'admin_user', entityId: user.id,
    newValue: { email, full_name, role }, request,
  })

  return NextResponse.json({ user })
}
