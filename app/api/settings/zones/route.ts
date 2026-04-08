import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('zones').select('*').order('name')
  return NextResponse.json({ zones: data })
}

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { name, city } = await request.json()
  if (!name || !city) return NextResponse.json({ error: 'name and city required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('zones').insert({ name, city }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.ZONE_CREATE, entityType: 'zone', entityId: data.id,
    newValue: { name, city }, request,
  })

  return NextResponse.json({ zone: data })
}
