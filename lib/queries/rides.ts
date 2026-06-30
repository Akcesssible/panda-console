import { api } from '@/lib/api/client'
import { paths } from '@/lib/api/paths'
import type { BackendPage, BackendTrip } from '@/lib/api/types'
import type { Ride, RideStatus } from '@/lib/types'

const PER_PAGE = 20

// Map backend trip status → portal RideStatus
const TRIP_STATUS_MAP: Record<string, RideStatus> = {
  REQUESTED:   'requested',
  MATCHED:     'requested',
  ACCEPTED:    'accepted',
  IN_PROGRESS: 'ongoing',
  COMPLETED:   'completed',
  CANCELLED:   'cancelled',
}

function toRide(t: BackendTrip): Ride {
  return {
    id: t.id,
    ride_number: t.id.slice(0, 8).toUpperCase(),
    driver_id: t.driverId ?? null,
    rider_phone: '',
    rider_name: null,
    vehicle_type: (t.vehicleType?.toLowerCase() ?? 'car') as Ride['vehicle_type'],
    zone_id: null,
    pricing_rule_id: null,
    status: TRIP_STATUS_MAP[t.status] ?? 'cancelled',
    pickup_address: t.pickupAddress,
    pickup_lat: t.pickupLat ?? null,
    pickup_lng: t.pickupLng ?? null,
    destination_address: t.destinationAddress,
    destination_lat: t.destinationLat ?? null,
    destination_lng: t.destinationLng ?? null,
    distance_km: t.distanceKm ?? null,
    duration_minutes: t.durationMinutes ?? null,
    base_fare_tzs: null,
    distance_fare_tzs: null,
    time_fare_tzs: null,
    peak_multiplier: 1,
    total_fare_tzs: t.fareActual ?? null,
    commission_rate: 0,
    commission_tzs: 0,
    driver_earnings_tzs: null,
    is_subscriber_ride: false,
    cancellation_reason: t.cancellationReason ?? null,
    cancelled_by: t.cancelledBy ?? null,
    is_flagged: false,
    flag_reason: null,
    requested_at: t.requestedAt,
    accepted_at: t.acceptedAt ?? null,
    started_at: t.startedAt ?? null,
    completed_at: t.completedAt ?? null,
    cancelled_at: t.cancelledAt ?? null,
    created_at: t.requestedAt,
    drivers: null,
    zones: null,
  }
}

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
  const { page = 1 } = params

  const qs = new URLSearchParams()
  qs.set('page', String(page - 1))
  qs.set('size', String(PER_PAGE))

  try {
    const result = await api.get<BackendPage<BackendTrip>>(
      `${paths.tripsAdmin}?${qs.toString()}`
    )
    return {
      rides: (result?.content ?? []).map(toRide) as Ride[],
      total: result?.totalElements ?? 0,
    }
  } catch {
    return { rides: [], total: 0 }
  }
}

export async function getRideById(id: string) {
  const trip = await api.get<BackendTrip>(paths.trip(id))
  return Object.assign(toRide(trip), { support_tickets: [] }) as Ride & {
    support_tickets: unknown[]
  }
}
