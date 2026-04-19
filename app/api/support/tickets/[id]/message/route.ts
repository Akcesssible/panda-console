import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'
import { parseBody, TicketMessageSchema } from '@/lib/validations'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try { requireRole(adminUser, ['super_admin', 'ops_admin', 'support_agent']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { id } = await params

  const body = await parseBody(request, TicketMessageSchema)
  if (body instanceof NextResponse) return body

  const { message } = body

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: id,
      sender_type: 'admin',
      sender_id: adminUser.id,
      sender_name: adminUser.full_name,
      message,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.TICKET_MESSAGE, entityType: 'support_ticket', entityId: id,
    newValue: { message }, request,
  })

  return NextResponse.json({ message: data })
}
