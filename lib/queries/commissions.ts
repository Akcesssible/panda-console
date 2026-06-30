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

export async function getCommissionRides(
  _params: { page?: number } = {},
): Promise<{ rides: CommissionRide[]; total: number }> {
  return { rides: [], total: 0 }
}

export async function getCommissionStats(
  _firstOfMonth: string,
): Promise<{ monthRevenue: number; todayRevenue: number; totalRides: number }> {
  return { monthRevenue: 0, todayRevenue: 0, totalRides: 0 }
}
