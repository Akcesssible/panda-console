import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { driver_id, plan_id, notes } = await request.json()
  if (!driver_id || !plan_id) return NextResponse.json({ error: 'driver_id and plan_id required' }, { status: 400 })

  const supabase = createAdminClient()

  // Get plan for duration
  const { data: plan } = await supabase.from('subscription_plans').select('*').eq('id', plan_id).single()
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const now = new Date()
  const expiresAt = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000)
  const graceEndsAt = new Date(expiresAt.getTime() + 24 * 60 * 60 * 1000)

  const { data: sub, error } = await supabase
    .from('driver_subscriptions')
    .insert({
      driver_id,
      plan_id,
      status: 'active',
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      grace_ends_at: graceEndsAt.toISOString(),
      assigned_by: adminUser.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.SUB_ASSIGN, entityType: 'driver_subscription', entityId: sub.id,
    newValue: { driver_id, plan_id, expires_at: expiresAt.toISOString() },
    metadata: notes ? { notes } : undefined,
    request,
  })

  return NextResponse.json({ success: true, subscription: sub })
}
