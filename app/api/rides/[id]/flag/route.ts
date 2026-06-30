import { NextResponse } from 'next/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody, RideFlagSchema } from '@/lib/validations'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { id } = await params

  const body = await parseBody(request, RideFlagSchema)
  if (body instanceof NextResponse) return body

  const { reason } = body

  logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.RIDE_FLAG, entityType: 'ride', entityId: id,
    metadata: { reason }, request,
  }).catch(err => console.error('[ride-flag] audit failed', err))

  return NextResponse.json({ success: true })
}
