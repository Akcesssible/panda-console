import { z } from 'zod'
import { NextResponse } from 'next/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
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
  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { id } = await params

  const body = await parseBody(request, ResolveSchema)
  if (body instanceof NextResponse) return body

  console.warn('[support-ticket] resolve endpoint not backed by backend yet, ticket:', id)
  return NextResponse.json({ success: true })
}
