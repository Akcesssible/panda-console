import { createAdminClient } from '@/lib/supabase/server'
import type { Driver, DriverStatus } from '@/lib/types'

const PER_PAGE = 20

export async function getDrivers(params: {
  status?: DriverStatus | DriverStatus[]
  page?: number
  search?: string
  zoneId?: string
}) {
  const supabase = createAdminClient()
  const { status, page = 1, search, zoneId } = params
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('drivers')
    .select(`
      *,
      zones(id, name),
      vehicles(id, vehicle_type, make, model, license_plate),
      driver_subscriptions(id, status, expires_at, plan_id)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status)
    } else {
      query = query.eq('status', status)
    }
  }

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,phone.ilike.%${search}%,driver_number.ilike.%${search}%`
    )
  }

  if (zoneId) {
    query = query.eq('zone_id', zoneId)
  }

  const { data, count, error } = await query
  if (error) throw error
  return { drivers: (data ?? []) as Driver[], total: count ?? 0 }
}

export async function getDriverById(id: string) {
  const supabase = createAdminClient()

  const [driverResult, docsResult, ridesResult] = await Promise.all([
    supabase
      .from('drivers')
      .select(`
        *,
        zones(id, name, city),
        vehicles(*),
        driver_subscriptions(*, subscription_plans(*))
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', id),
    supabase
      .from('rides')
      .select('id, ride_number, pickup_address, destination_address, status, total_fare_tzs, commission_tzs, driver_earnings_tzs, requested_at, completed_at')
      .eq('driver_id', id)
      .order('requested_at', { ascending: false })
      .limit(50),
  ])

  if (driverResult.error) throw driverResult.error

  return {
    driver: driverResult.data as Driver,
    documents: docsResult.data ?? [],
    rides: ridesResult.data ?? [],
  }
}
