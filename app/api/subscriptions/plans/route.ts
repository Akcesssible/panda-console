import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('subscription_plans').select('*').order('price_tzs')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plans: data })
}

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await request.json()
  const { name, duration_days, price_tzs, vehicle_types, description } = body

  if (!name || !duration_days || !price_tzs) {
    return NextResponse.json({ error: 'name, duration_days, price_tzs required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('subscription_plans')
    .insert({ name, duration_days, price_tzs, vehicle_types: vehicle_types ?? ['bodaboda', 'bajaj', 'car'], description })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.SUB_PLAN_CREATE, entityType: 'subscription_plan', entityId: data.id,
    newValue: { name, duration_days, price_tzs }, request,
  })

  return NextResponse.json({ plan: data })
}
