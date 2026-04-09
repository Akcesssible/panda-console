import { createAdminClient } from '@/lib/supabase/server'
import type { Rider, RiderStatus } from '@/lib/types'

const PER_PAGE = 20

export async function getRiders(params: {
  status?: RiderStatus
  page?: number
  search?: string
}) {
  const supabase = createAdminClient()
  const { status, page = 1, search } = params
  const from = (page - 1) * PER_PAGE
  const to   = from + PER_PAGE - 1

  let query = supabase
    .from('riders')
    .select('*', { count: 'exact' })
    .order('registered_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,phone.ilike.%${search}%,rider_number.ilike.%${search}%`
    )
  }

  const { data, count, error } = await query
  if (error) throw error
  return { riders: (data ?? []) as Rider[], total: count ?? 0 }
}
