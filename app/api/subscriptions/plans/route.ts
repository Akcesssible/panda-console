import { NextResponse } from 'next/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { api } from '@/lib/api/client'
import { paths } from '@/lib/api/paths'
import { toPlan, toCreatePlanBody } from '@/lib/api/adapters'
import { ApiError } from '@/lib/api/errors'
import type { PlanResponse } from '@/lib/api/types'

// Plans are owned by the backend (subscription-service). These handlers proxy
// to /api/v1/subscriptions/plans; admin audit logging stays in Supabase.

export async function GET() {
  try {
    const plans = await api.get<PlanResponse[]>(paths.subscriptionPlans)
    return NextResponse.json({ plans: (plans ?? []).map(toPlan) })
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 500
    return NextResponse.json({ error: (e as Error).message }, { status })
  }
}

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await request.json()
  const { name, price_tzs, description, tripQuota } = body

  if (!name || !price_tzs) {
    return NextResponse.json({ error: 'name and price_tzs are required' }, { status: 400 })
  }

  try {
    const created = await api.post<PlanResponse>(
      paths.subscriptionPlans,
      toCreatePlanBody({ name, price_tzs, description, tripQuota }),
    )

    await logAdminAction({
      adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
      action: AUDIT_ACTIONS.SUB_PLAN_CREATE, entityType: 'subscription_plan', entityId: created.id,
      newValue: { name, price_tzs }, request,
    })

    return NextResponse.json({ plan: toPlan(created) })
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 500
    return NextResponse.json({ error: (e as Error).message }, { status })
  }
}
