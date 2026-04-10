import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest } from '@/lib/auth'
import { canAccess } from '@/lib/types'

export async function GET(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Access is governed by the permissions matrix — any role with audit_logs read+ can view
  if (!canAccess(adminUser.role, 'audit_logs')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const entityType = searchParams.get('entity_type')
  const adminId = searchParams.get('admin_id')
  const fromDate = searchParams.get('from_date')
  const toDate = searchParams.get('to_date')
  const page = Number(searchParams.get('page') ?? 1)
  const perPage = 50
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const supabase = createAdminClient()
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (action) query = query.ilike('action', `%${action}%`)
  if (entityType) query = query.eq('entity_type', entityType)
  if (adminId) query = query.eq('admin_id', adminId)
  if (fromDate) query = query.gte('created_at', fromDate)
  if (toDate) query = query.lte('created_at', toDate)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data, total: count })
}
