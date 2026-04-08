import { RideStatusBadge } from '@/components/ui/Badge'
import { formatDateTime, formatTZS } from '@/lib/utils'

interface Ride {
  id: string
  ride_number: string
  pickup_address: string
  destination_address: string
  status: string
  total_fare_tzs: number | null
  driver_earnings_tzs: number | null
  requested_at: string
  completed_at: string | null
}

export function DriverRideHistory({ rides }: { rides: Ride[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Driver Trip Activity</h2>
        <span className="text-xs text-gray-500">{rides.length} recent rides</span>
      </div>
      <div className="divide-y divide-gray-100">
        {rides.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No rides found</p>
        ) : (
          rides.slice(0, 20).map(ride => (
            <div key={ride.id} className="px-5 py-3 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-gray-700">{ride.ride_number}</span>
                  <RideStatusBadge status={ride.status} />
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {ride.pickup_address} → {ride.destination_address}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(ride.requested_at)}</p>
              </div>
              <div className="text-right shrink-0">
                {ride.driver_earnings_tzs != null && (
                  <p className="text-sm font-medium text-gray-900">
                    {formatTZS(ride.driver_earnings_tzs)}
                  </p>
                )}
                {ride.total_fare_tzs != null && (
                  <p className="text-xs text-gray-400">Fare: {formatTZS(ride.total_fare_tzs)}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
