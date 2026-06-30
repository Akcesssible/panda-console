import { NextResponse } from 'next/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { api } from '@/lib/api/client'
import { paths } from '@/lib/api/paths'
import { toPlan } from '@/lib/api/adapters'
import { ApiError } from '@/lib/api/errors'
import type { PlanResponse, UpdatePlanBody } from '@/lib/api/types'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { id } = await params
  const body = await request.json() as UpdatePlanBody

  const { name, price_tzs, description, tripQuota, active } = body as Record<string, unknown>

  const updateBody: UpdatePlanBody = {}
  if (name !== undefined)        updateBody.name        = name as string
  if (price_tzs !== undefined)   updateBody.monthlyFee  = Number(price_tzs)
  if (description !== undefined) updateBody.description = description as string | null
  if (tripQuota !== undefined)   updateBody.tripQuota   = Number(tripQuota)
  if (active !== undefined)      updateBody.active      = Boolean(active)

  try {
    const updated = await api.patch<PlanResponse>(paths.subscriptionPlan(id), updateBody)

    await logAdminAction({
      adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
      action: AUDIT_ACTIONS.SUB_PLAN_UPDATE, entityType: 'subscription_plan', entityId: id,
      newValue: updateBody as Record<string, unknown>, request,
    })

    return NextResponse.json({ plan: toPlan(updated) })
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 500
    return NextResponse.json({ error: (e as Error).message }, { status })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { id } = await params

  try {
    await api.del(paths.subscriptionPlan(id))

    await logAdminAction({
      adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
      action: AUDIT_ACTIONS.SUB_PLAN_DELETE, entityType: 'subscription_plan', entityId: id,
      request,
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 500
    return NextResponse.json({ error: (e as Error).message }, { status })
  }
}
