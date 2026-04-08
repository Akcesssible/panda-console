import { getRideById } from '@/lib/queries/rides'
import { getAdminUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RideStatusBadge } from '@/components/ui/Badge'
import { formatTZS, formatDateTime, formatDuration } from '@/lib/utils'
import { FlagRideButton } from '@/components/rides/FlagRideButton'
import type { Ride } from '@/lib/types'

export default async function RideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [adminUser, ride] = await Promise.all([
    getAdminUser(),
    getRideById(id).catch(() => null),
  ])

  if (!ride) notFound()

  const timeline = [
    { label: 'Requested', time: ride.requested_at },
    { label: 'Accepted', time: ride.accepted_at },
    { label: 'Started', time: ride.started_at },
    ride.status === 'completed'
      ? { label: 'Completed', time: ride.completed_at }
      : { label: 'Cancelled', time: ride.cancelled_at },
  ].filter(t => t.time)

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/rides" className="hover:text-gray-900">Rides</Link>
        <span>/</span>
        <span className="text-gray-900">{ride.ride_number}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-semibold text-gray-900">{ride.ride_number}</h1>
              <RideStatusBadge status={ride.status} />
              {ride.is_flagged && (
                <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  Flagged
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{ride.vehicle_type} — {(ride.zones as { name: string } | null)?.name ?? '—'}</p>
          </div>
          <div className="flex gap-2">
            {!ride.is_flagged && <FlagRideButton rideId={ride.id} adminRole={adminUser.role} />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Driver & Rider */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Driver & Rider</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Driver</p>
              {ride.drivers ? (
                <div>
                  <Link href={`/drivers/${ride.drivers.id}`} className="font-medium text-blue-600 hover:underline">
                    {ride.drivers.full_name}
                  </Link>
                  <p className="text-xs text-gray-500">{ride.drivers.phone} · {ride.drivers.driver_number}</p>
                </div>
              ) : (
                <span className="text-gray-400">Unassigned</span>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Rider</p>
              <p className="font-medium text-gray-900">{ride.rider_name ?? '—'}</p>
              <p className="text-xs text-gray-500">{ride.rider_phone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Subscriber Ride</p>
              <p className="text-gray-700">{ride.is_subscriber_ride ? 'Yes (0% commission)' : 'No'}</p>
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Route</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Pickup</p>
              <p className="text-gray-900">{ride.pickup_address}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Destination</p>
              <p className="text-gray-900">{ride.destination_address}</p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-gray-400">Distance</p>
                <p className="text-gray-900">{ride.distance_km ? `${ride.distance_km} km` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Duration</p>
                <p className="text-gray-900">{formatDuration(ride.duration_minutes)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fare Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Fare Breakdown</h2>
          <div className="space-y-2 text-sm">
            <FareRow label="Base Fare" value={formatTZS(ride.base_fare_tzs ?? 0)} />
            <FareRow label="Distance Fare" value={formatTZS(ride.distance_fare_tzs ?? 0)} />
            <FareRow label="Time Fare" value={formatTZS(ride.time_fare_tzs ?? 0)} />
            {ride.peak_multiplier > 1 && (
              <FareRow label={`Peak Multiplier (×${ride.peak_multiplier})`} value="" />
            )}
            <div className="border-t border-gray-100 pt-2 mt-2">
              <FareRow label="Subtotal / Total Fare" value={formatTZS(ride.total_fare_tzs ?? 0)} bold />
              <FareRow
                label={`Commission (${(ride.commission_rate * 100).toFixed(0)}%)`}
                value={`−${formatTZS(ride.commission_tzs)}`}
              />
              <FareRow
                label="Driver Earnings"
                value={formatTZS(ride.driver_earnings_tzs ?? 0)}
                bold
                green
              />
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Status Timeline</h2>
          <div className="space-y-3">
            {timeline.map((t, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  {i < timeline.length - 1 && <div className="w-px h-6 bg-gray-200 mt-1" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.label}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(t.time)}</p>
                </div>
              </div>
            ))}
          </div>

          {ride.cancellation_reason && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">Cancellation Reason</p>
              <p className="text-sm text-gray-700 mt-0.5">{ride.cancellation_reason}</p>
              <p className="text-xs text-gray-400 mt-1">By: {ride.cancelled_by}</p>
            </div>
          )}
        </div>
      </div>

      {/* Linked Disputes */}
      {(ride as Ride & { support_tickets?: unknown[] }).support_tickets?.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Linked Disputes</h2>
          <div className="space-y-2">
            {((ride as Ride & { support_tickets: Array<{ id: string; ticket_number: string; type: string; status: string; subject: string }> }).support_tickets).map(t => (
              <Link
                key={t.id}
                href={`/support/${t.id}`}
                className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">{t.ticket_number}</span>
                  <span className="text-xs text-gray-500 ml-2">{t.subject}</span>
                </div>
                <span className="text-xs text-gray-400 capitalize">{t.status.replace('_', ' ')}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function FareRow({ label, value, bold, green }: { label: string; value: string; bold?: boolean; green?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`${bold ? 'font-semibold text-gray-900' : 'text-gray-700'} ${green ? 'text-green-700' : ''}`}>
        {value}
      </span>
    </div>
  )
}
