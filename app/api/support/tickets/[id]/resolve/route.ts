import { z } from 'zod'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody } from '@/lib/validations'

const ResolveSchema = z.object({
  action: z.enum(['no_action', 'fare_adjusted', 'refund_issued', 'driver_warned', 'driver_suspended']),
  note: z.string().max(2000).optional(),
  fare_adjusted: z.number().positive().optional(),
  refund_amount: z.number().positive().optional(),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const body = await parseBody(request, ResolveSchema)
  if (body instanceof NextResponse) return body

  const { action, note, fare_adjusted, refund_amount } = body

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('ride_id, driver_id')
    .eq('id', id)
    .single()

  if (action === 'fare_adjusted' && fare_adjusted && ticket?.ride_id) {
    await supabase
      .from('rides')
      .update({ total_fare_tzs: fare_adjusted })
      .eq('id', ticket.ride_id)

    await logAdminAction({
      adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
      action: AUDIT_ACTIONS.FARE_ADJUST, entityType: 'ride', entityId: ticket.ride_id,
      newValue: { total_fare_tzs: fare_adjusted }, request,
    })
  }

  if (action === 'refund_issued' && refund_amount) {
    await logAdminAction({
      adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
      action: AUDIT_ACTIONS.REFUND_ISSUE, entityType: 'support_ticket', entityId: id,
      metadata: { refund_amount }, request,
    })
  }

  if (action === 'driver_warned' && ticket?.driver_id) {
    await supabase
      .from('drivers')
      .update({ complaints_count: supabase.rpc('increment', { row_id: ticket.driver_id, x: 1 }) as unknown as number })
      .eq('id', ticket.driver_id)
  }

  if (action === 'driver_suspended' && ticket?.driver_id) {
    await supabase
      .from('drivers')
      .update({
        status: 'suspended',
        suspended_reason: `Support ticket: ${id}`,
        suspended_by: adminUser.id,
        suspended_at: now,
      })
      .eq('id', ticket.driver_id)

    await logAdminAction({
      adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
      action: AUDIT_ACTIONS.DRIVER_SUSPEND, entityType: 'driver', entityId: ticket.driver_id,
      newValue: { status: 'suspended', reason: `Via ticket ${id}` }, request,
    })
  }

  const { error } = await supabase
    .from('support_tickets')
    .update({
      status: 'resolved',
      resolution_action: action,
      resolution_note: note,
      fare_adjusted_tzs: fare_adjusted ?? null,
      refund_amount_tzs: refund_amount ?? null,
      resolved_at: now,
      resolved_by: adminUser.id,
      updated_at: now,
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.TICKET_RESOLVE, entityType: 'support_ticket', entityId: id,
    newValue: { status: 'resolved', resolution_action: action }, request,
  })

  return NextResponse.json({ success: true })
}
