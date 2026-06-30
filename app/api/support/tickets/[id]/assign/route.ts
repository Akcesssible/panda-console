import { NextResponse } from 'next/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { parseBody, AssignTicketSchema } from '@/lib/validations'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try { requireRole(adminUser, ['super_admin', 'ops_admin', 'support_agent']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { id } = await params

  const body = await parseBody(request, AssignTicketSchema)
  if (body instanceof NextResponse) return body

  console.warn('[support-ticket] assign endpoint not backed by backend yet, ticket:', id)
  return NextResponse.json({ success: true })
}
