import { createAdminClient } from '@/lib/supabase/server'

const PER_PAGE = 20

export interface CommissionRide {
  id: string
  ride_number: string
  driver_id: string | null
  vehicle_type: string
  total_fare_tzs: number | null
  commission_rate: number
  commission_tzs: number
  driver_earnings_tzs: number | null
  completed_at: string | null
  drivers: {
    full_name: string
    driver_number: string
    phone: string
    driver_subscriptions?: { status: string }[]
  } | null
}

export async function getCommissionRides({
  page = 1,
}: { page?: number } = {}): Promise<{ rides: CommissionRide[]; total: number }> {
  const supabase = createAdminClient()
  const from = (page - 1) * PER_PAGE
  const to   = from + PER_PAGE - 1

  // Fetch driver IDs who currently hold an active subscription — they are
  // exempt from commission, so we exclude their rides from this page.
  const { data: activeSubs } = await supabase
    .from('driver_subscriptions')
    .select('driver_id')
    .eq('status', 'active')

  const activeDriverIds = (activeSubs ?? []).map(r => r.driver_id).filter(Boolean) as string[]

  let query = supabase
    .from('rides')
    .select(
      `id, ride_number, driver_id, vehicle_type, total_fare_tzs, commission_rate,
       commission_tzs, driver_earnings_tzs, completed_at,
       drivers ( full_name, driver_number, phone, driver_subscriptions ( status ) )`,
      { count: 'exact' },
    )
    .eq('status', 'completed')
    .eq('is_subscriber_ride', false)
    .gt('commission_tzs', 0)
    .order('completed_at', { ascending: false })
    .range(from, to)

  if (activeDriverIds.length > 0) {
    query = query.not('driver_id', 'in', `(${activeDriverIds.join(',')})`)
  }

  const { data, count, error } = await query

  if (error) return { rides: [], total: 0 }
  return { rides: (data ?? []) as unknown as CommissionRide[], total: count ?? 0 }
}

export async function getCommissionStats(firstOfMonth: string) {
  const supabase = createAdminClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [monthRes, todayRes, totalRes] = await Promise.allSettled([
    supabase
      .from('rides')
      .select('commission_tzs')
      .eq('status', 'completed')
      .eq('is_subscriber_ride', false)
      .gt('commission_tzs', 0)
      .gte('completed_at', firstOfMonth),
    supabase
      .from('rides')
      .select('commission_tzs')
      .eq('status', 'completed')
      .eq('is_subscriber_ride', false)
      .gt('commission_tzs', 0)
      .gte('completed_at', today.toISOString()),
    supabase
      .from('rides')
      .select('commission_tzs, *', { count: 'exact', head: false })
      .eq('status', 'completed')
      .eq('is_subscriber_ride', false)
      .gt('commission_tzs', 0),
  ])

  const monthRows  = monthRes.status  === 'fulfilled' ? (monthRes.value.data  ?? []) : []
  const todayRows  = todayRes.status  === 'fulfilled' ? (todayRes.value.data  ?? []) : []
  const totalCount = totalRes.status  === 'fulfilled' ? (totalRes.value.count ?? 0)  : 0

  const monthRevenue = monthRows.reduce((s: number, r: { commission_tzs: number }) => s + (r.commission_tzs ?? 0), 0)
  const todayRevenue = todayRows.reduce((s: number, r: { commission_tzs: number }) => s + (r.commission_tzs ?? 0), 0)

  return { monthRevenue, todayRevenue, totalRides: totalCount }
}
