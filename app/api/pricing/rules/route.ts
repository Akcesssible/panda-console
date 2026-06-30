import { NextResponse } from 'next/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'

// Pricing rules — no backend pricing-service endpoint yet. Stub GET with empty
// list; accept POST mutations with a local audit log and success response.
export async function GET() {
  return NextResponse.json({ rules: [] })
}

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await request.json()

  logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.PRICING_CREATE, entityType: 'pricing_rule', entityId: undefined,
    newValue: body, request,
  }).catch(err => console.error('[pricing] audit failed', err))

  return NextResponse.json({ rule: body })
}
