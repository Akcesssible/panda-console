import { platformQuery } from '@/lib/platform-db'
import type { Rider, RiderStatus } from '@/lib/types'

const PER_PAGE = 20
const INACTIVE_AFTER_DAYS = 30

type PlatformRiderRow = {
  id: string
  phone: string | null
  email: string | null
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  gender: string | null
  date_of_birth: string | null
  status: string | null
  registration_step: number | null
  created_at: string | null
  updated_at: string | null
  last_login_at: string | null
}

type RiderTripAggregateRow = {
  rider_id: string
  total_rides: string | number
  completed_rides: string | number
  cancelled_rides: string | number
  last_ride_at: string | null
}

type RiderTripRow = {
  id: string
  rider_id: string
  driver_id: string | null
  pickup_address: string
  destination_address: string
  fare_actual: string | number | null
  fare_estimate: string | number | null
  distance_km: string | number | null
  duration_minutes: number | null
  payment_status: string | null
  status: string
  requested_at: string
  accepted_at: string | null
  started_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string | null
  vehicle_type: string | null
  driver_name: string | null
  driver_phone: string | null
}

type RiderPaymentRow = {
  id: string
  rider_id: string
  amount_tzs: string | number | null
  status: string | null
  payment_type: string | null
  created_at: string | null
  updated_at: string | null
  trip_id: string | null
}

export async function getRiders(params: {
  status?: RiderStatus
  page?: number
  search?: string
}): Promise<{ riders: Rider[]; total: number }> {
  const { status, page = 1, search } = params
  const riders = await fetchPlatformRiders()
  const all = riders
    .filter(rider => {
      if (status && rider.status !== status) return false
      if (!search) return true
      const q = search.toLowerCase()
      return [
        rider.rider_number,
        rider.full_name,
        rider.phone,
        rider.email,
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(q))
    })

  const start = (page - 1) * PER_PAGE
  return {
    riders: all.slice(start, start + PER_PAGE),
    total: all.length,
  }
}

export async function getRiderById(id: string) {
  const [riderRows, aggregates, tripRows, paymentRows] = await Promise.all([
    platformQuery<PlatformRiderRow>(`
      select id, phone, email, first_name, middle_name, last_name, gender, date_of_birth, status, registration_step, created_at, updated_at, last_login_at
      from riders
      where id = $1::uuid
      limit 1
    `, [id]),
    fetchRiderTripAggregates([id]),
    platformQuery<RiderTripRow>(`
      select
        t.*,
        trim(concat_ws(' ', dp.first_name, dp.middle_name, dp.last_name)) as driver_name,
        d.phone as driver_phone
      from trips t
      left join driver_profiles dp on dp.id = t.driver_id
      left join drivers d on d.id = t.driver_id
      where t.rider_id = $1::uuid
      order by t.created_at desc
      limit 20
    `, [id]),
    platformQuery<RiderPaymentRow>(`
      select id, rider_id, amount_tzs, status, payment_type, created_at, updated_at, trip_id
      from payments
      where rider_id = $1::uuid
      order by coalesce(updated_at, created_at) desc
      limit 20
    `, [id]),
  ])

  const riderRow = riderRows.rows[0]
  if (!riderRow) {
    throw new Error('Rider not found')
  }

  const aggregate = aggregates.get(id)
  const rider = toRider(riderRow, aggregate)

  return {
    rider,
    trips: tripRows.rows.map(row => ({
      id: row.id,
      ride_number: row.id.slice(0, 8).toUpperCase(),
      driver_id: row.driver_id,
      rider_phone: rider.phone,
      rider_name: rider.full_name,
      vehicle_type: normalizeRideVehicleType(row.vehicle_type),
      zone_id: null,
      pricing_rule_id: null,
      status: normalizeRideStatus(row.status),
      pickup_address: row.pickup_address,
      pickup_lat: null,
      pickup_lng: null,
      destination_address: row.destination_address,
      destination_lat: null,
      destination_lng: null,
      distance_km: row.distance_km == null ? null : Number(row.distance_km),
      duration_minutes: row.duration_minutes,
      base_fare_tzs: null,
      distance_fare_tzs: null,
      time_fare_tzs: null,
      peak_multiplier: 1,
      total_fare_tzs: Number(row.fare_actual ?? row.fare_estimate ?? 0),
      commission_rate: 0,
      commission_tzs: 0,
      driver_earnings_tzs: null,
      is_subscriber_ride: false,
      cancellation_reason: null,
      cancelled_by: null,
      is_flagged: false,
      flag_reason: null,
      requested_at: row.requested_at,
      accepted_at: row.accepted_at,
      started_at: row.started_at,
      completed_at: row.completed_at,
      cancelled_at: row.cancelled_at,
      created_at: row.created_at,
      drivers: row.driver_id ? {
        id: row.driver_id,
        full_name: row.driver_name ?? 'Driver',
        phone: row.driver_phone ?? '',
        driver_number: `DRV-${row.driver_id.slice(0, 6).toUpperCase()}`,
        rating: 0,
      } : null,
      zones: null,
    })),
    payments: paymentRows.rows.map(row => ({
      id: row.id,
      rider_id: row.rider_id,
      amount_tzs: Number(row.amount_tzs ?? 0),
      status: normalizePaymentStatus(row.status),
      payment_type: row.payment_type?.toLowerCase() ?? 'trip',
      paid_at: row.updated_at ?? row.created_at ?? null,
      trip_id: row.trip_id,
    })),
  }
}

async function fetchPlatformRiders() {
  const [{ rows }, aggregates] = await Promise.all([
    platformQuery<PlatformRiderRow>(`
      select id, phone, email, first_name, middle_name, last_name, gender, date_of_birth, status, registration_step, created_at, updated_at, last_login_at
      from riders
      order by created_at desc
    `),
    fetchRiderTripAggregates(),
  ])

  return rows.map(row => toRider(row, aggregates.get(row.id)))
}

async function fetchRiderTripAggregates(ids?: string[]) {
  const where = ids?.length ? 'where rider_id = any($1::uuid[])' : ''
  const values = ids?.length ? [ids] : []
  const { rows } = await platformQuery<RiderTripAggregateRow>(`
    select
      rider_id,
      count(*) as total_rides,
      count(*) filter (where status = 'COMPLETED') as completed_rides,
      count(*) filter (where status = 'CANCELLED') as cancelled_rides,
      max(coalesce(completed_at, updated_at, created_at)) as last_ride_at
    from trips
    ${where}
    group by rider_id
  `, values)

  return new Map(rows.map(row => [row.rider_id, row]))
}

function toRider(row: PlatformRiderRow, aggregate?: RiderTripAggregateRow): Rider {
  const lastRideAt = aggregate?.last_ride_at ?? row.last_login_at
  const registrationComplete = (row.registration_step ?? 0) >= 3 && (row.status ?? '').toUpperCase() === 'ACTIVE'
  const derivedStatus: RiderStatus =
    !registrationComplete
      ? 'inactive'
      : isOlderThanDays(lastRideAt, INACTIVE_AFTER_DAYS)
        ? 'inactive'
        : 'active'

  return {
    id: row.id,
    rider_number: `RDR-${row.id.slice(0, 6).toUpperCase()}`,
    full_name: fullName(row) ?? row.phone ?? row.id,
    phone: row.phone ?? '',
    email: row.email,
    avatar_url: null,
    status: derivedStatus,
    total_rides: Number(aggregate?.total_rides ?? 0),
    completed_rides: Number(aggregate?.completed_rides ?? 0),
    cancelled_rides: Number(aggregate?.cancelled_rides ?? 0),
    last_ride_at: aggregate?.last_ride_at ?? row.last_login_at ?? null,
    registered_at: row.created_at ?? new Date(0).toISOString(),
    created_at: row.created_at ?? new Date(0).toISOString(),
    updated_at: row.updated_at ?? row.created_at ?? new Date(0).toISOString(),
    ban_reason: null,
    banned_at: null,
  }
}

function isOlderThanDays(dateString: string | null | undefined, days: number) {
  if (!dateString) return false
  const ageMs = Date.now() - new Date(dateString).getTime()
  return ageMs >= days * 24 * 60 * 60 * 1000
}

function fullName(row: PlatformRiderRow) {
  return [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(' ').trim() || null
}

function normalizeRideStatus(value: string) {
  switch (value) {
    case 'ACCEPTED':
      return 'accepted'
    case 'IN_PROGRESS':
      return 'ongoing'
    case 'COMPLETED':
      return 'completed'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return 'requested'
  }
}

function normalizeRideVehicleType(value: string | null | undefined): 'bodaboda' | 'bajaj' | 'car' {
  switch ((value ?? '').toUpperCase()) {
    case 'PANDA_BODA':
      return 'bodaboda'
    case 'PANDA_BAJAJ':
      return 'bajaj'
    default:
      return 'car'
  }
}

function normalizePaymentStatus(value: string | null | undefined) {
  switch ((value ?? '').toUpperCase()) {
    case 'COMPLETED':
      return 'completed'
    case 'FAILED':
      return 'failed'
    default:
      return 'pending'
  }
}
