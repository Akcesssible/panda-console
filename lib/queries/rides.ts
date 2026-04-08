import { createAdminClient } from '@/lib/supabase/server'
import type { Ride, RideStatus } from '@/lib/types'

const PER_PAGE = 20

export async function getRides(params: {
  status?: RideStatus | RideStatus[]
  flagged?: boolean
  driverId?: string
  zoneId?: string
  fromDate?: string
  toDate?: string
  page?: number
  search?: string
}) {
  const supabase = createAdminClient()
  const { status, flagged, driverId, zoneId, fromDate, toDate, page = 1 } = params
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('rides')
    .select(`
      *,
      drivers(id, full_name, phone, driver_number, rating),
      zones(id, name)
    `, { count: 'exact' })
    .order('requested_at', { ascending: false })
    .range(from, to)

  if (status) {
    if (Array.isArray(status)) query = query.in('status', status)
    else query = query.eq('status', status)
  }
  if (flagged) query = query.eq('is_flagged', true)
  if (driverId) query = query.eq('driver_id', driverId)
  if (zoneId) query = query.eq('zone_id', zoneId)
  if (fromDate) query = query.gte('requested_at', fromDate)
  if (toDate) query = query.lte('requested_at', toDate)

  const { data, count, error } = await query
  if (error) throw error
  return { rides: (data ?? []) as Ride[], total: count ?? 0 }
}

export async function getRideById(id: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('rides')
    .select(`
      *,
      drivers(id, full_name, phone, driver_number, rating),
      zones(id, name, city),
      pricing_rules(id, name, base_fare_tzs, per_km_rate_tzs, per_minute_rate, peak_multiplier),
      support_tickets(id, ticket_number, type, status, subject, created_at)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Ride & {
    support_tickets: Array<{ id: string; ticket_number: string; type: string; status: string; subject: string; created_at: string }>
  }
}
