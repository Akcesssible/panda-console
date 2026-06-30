import { NextResponse } from 'next/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'

export async function GET() {
  return NextResponse.json({ zones: [] })
}

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { name, city } = await request.json()
  if (!name || !city) return NextResponse.json({ error: 'name and city required' }, { status: 400 })

  logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.ZONE_CREATE, entityType: 'zone', entityId: undefined,
    newValue: { name, city }, request,
  }).catch(err => console.error('[zones] audit failed', err))

  return NextResponse.json({ zone: { name, city } })
}
