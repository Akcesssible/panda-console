import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { admin_id } = await request.json()

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('support_tickets')
    .update({ assigned_to: admin_id, status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.TICKET_ASSIGN, entityType: 'support_ticket', entityId: id,
    newValue: { assigned_to: admin_id, status: 'in_progress' }, request,
  })

  return NextResponse.json({ success: true })
}
