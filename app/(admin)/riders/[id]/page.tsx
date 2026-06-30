import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge, RiderStatusBadge, RideStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge'
import { getRiderById } from '@/lib/queries/riders'
import { formatDate, formatDateTime, formatTZS, timeAgo } from '@/lib/utils'

export default async function RiderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getRiderById(id).catch(() => null)

  if (!result) {
    notFound()
  }

  const { rider, trips, payments } = result

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/riders" className="text-sm text-[#2B39C7] hover:underline">
            Back to riders
          </Link>
          <h1 className="text-2xl font-semibold text-[#1d242d] mt-2">{rider.full_name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <RiderStatusBadge status={rider.status} />
            <Badge variant="gray">{rider.rider_number}</Badge>
          </div>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>Joined {formatDate(rider.registered_at)}</p>
          <p>{rider.last_ride_at ? `Last activity ${timeAgo(rider.last_ride_at)}` : 'No trip activity yet'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Profile</h2>
          <Info label="Phone" value={rider.phone} />
          <Info label="Email" value={rider.email ?? '—'} />
          <Info label="Created" value={formatDateTime(rider.created_at)} />
          <Info label="Updated" value={formatDateTime(rider.updated_at)} />
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Ride Summary</h2>
          <Info label="Total rides" value={rider.total_rides.toLocaleString()} />
          <Info label="Completed" value={rider.completed_rides.toLocaleString()} />
          <Info label="Cancelled" value={rider.cancelled_rides.toLocaleString()} />
          <Info label="Last ride" value={rider.last_ride_at ? formatDateTime(rider.last_ride_at) : '—'} />
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Payments</h2>
          <Info label="Payment records" value={payments.length.toLocaleString()} />
          <Info label="Successful" value={payments.filter(payment => payment.status === 'completed').length.toLocaleString()} />
          <Info
            label="Latest payment"
            value={payments[0]?.paid_at ? formatDateTime(payments[0].paid_at) : '—'}
          />
          <Info
            label="Latest amount"
            value={payments[0] ? formatTZS(payments[0].amount_tzs) : '—'}
          />
        </section>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Recent Trips</h2>
          <span className="text-xs text-gray-400">{trips.length} loaded</span>
        </div>

        {trips.length === 0 ? (
          <p className="text-sm text-gray-400">No trips found for this rider.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-4 font-medium">Trip</th>
                  <th className="py-2 pr-4 font-medium">Driver</th>
                  <th className="py-2 pr-4 font-medium">Route</th>
                  <th className="py-2 pr-4 font-medium">Fare</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Requested</th>
                </tr>
              </thead>
              <tbody>
                {trips.map(trip => (
                  <tr key={trip.id} className="border-b border-gray-50 align-top">
                    <td className="py-3 pr-4 text-gray-700">{trip.ride_number}</td>
                    <td className="py-3 pr-4">
                      <p className="text-gray-900">{trip.drivers?.full_name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{trip.drivers?.phone ?? '—'}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-gray-700">{trip.pickup_address}</p>
                      <p className="text-xs text-gray-400 mt-1">{trip.destination_address}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{formatTZS(trip.total_fare_tzs ?? 0)}</td>
                    <td className="py-3 pr-4"><RideStatusBadge status={trip.status} /></td>
                    <td className="py-3 text-gray-500">{formatDateTime(trip.requested_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Recent Payments</h2>
          <span className="text-xs text-gray-400">{payments.length} loaded</span>
        </div>

        {payments.length === 0 ? (
          <p className="text-sm text-gray-400">No payments found for this rider.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-4 font-medium">Payment</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4 text-gray-700">{payment.id.slice(0, 8).toUpperCase()}</td>
                    <td className="py-3 pr-4 text-gray-700 capitalize">{payment.payment_type.replace('_', ' ')}</td>
                    <td className="py-3 pr-4 text-gray-700">{formatTZS(payment.amount_tzs)}</td>
                    <td className="py-3 pr-4"><PaymentStatusBadge status={payment.status} /></td>
                    <td className="py-3 text-gray-500">{formatDateTime(payment.paid_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-900 mt-1">{value}</p>
    </div>
  )
}
