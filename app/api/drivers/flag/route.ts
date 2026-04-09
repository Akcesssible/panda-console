import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody, DriverFlagSchema } from '@/lib/validations'

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await parseBody(request, DriverFlagSchema)
  if (body instanceof NextResponse) return body

  const { driver_id, reason: flag_reason } = body

  const supabase = createAdminClient()

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.DRIVER_FLAG,
    entityType: 'driver', entityId: driver_id,
    metadata: { flag_reason },
    request,
  })

  const { data: driver } = await supabase
    .from('drivers')
    .select('driver_number, full_name')
    .eq('id', driver_id)
    .single()

  await supabase.from('support_tickets').insert({
    ticket_number: `TKT-${Date.now()}`,
    type: 'driver_complaint',
    status: 'open',
    subject: `Driver flagged for review: ${driver?.full_name}`,
    description: flag_reason,
    reported_by: adminUser.email,
    reporter_type: 'admin',
    driver_id,
  })

  return NextResponse.json({ success: true })
}
