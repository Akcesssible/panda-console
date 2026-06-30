import { getDriverById } from '@/lib/queries/drivers'
import { getAdminUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { DriverDetailHeader } from '@/components/drivers/DriverDetailHeader'
import { DriverProfileCard } from '@/components/drivers/DriverProfileCard'
import { DriverPersonalInfo } from '@/components/drivers/DriverPersonalInfo'
import { DriverSubscriptionCard } from '@/components/drivers/DriverSubscriptionCard'
import { DriverVehicleGallery } from '@/components/drivers/DriverVehicleGallery'
import { DriverVehicleInfo } from '@/components/drivers/DriverVehicleInfo'
import { DriverRideHistory } from '@/components/drivers/DriverRideHistory'
import { StatsRow } from '@/components/ui/StatsRow'
import { formatTZS } from '@/lib/utils'
import type { StatItem } from '@/components/ui/StatsRow'

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [adminUser, result] = await Promise.all([
    getAdminUser(),
    getDriverById(id).catch(() => null),
  ])

  if (!result) {
    notFound()
  }

  const driver      = result.driver
  const documents   = result.documents
  const rides       = result.rides
  const todayTrips  = result.todayTrips
  const weekTrips   = result.weekTrips
  const lastPayment = result.lastPayment

  const completionRate = driver.total_trips > 0
    ? Math.round((driver.completed_trips / driver.total_trips) * 100)
    : 0
  const completedRideEarnings = rides
    .filter(ride => ride.status === 'completed' && ride.driver_earnings_tzs != null)
    .map(ride => ride.driver_earnings_tzs ?? 0)
  const activeDays = new Set(
    rides
      .filter(ride => ride.completed_at)
      .map(ride => new Date(ride.completed_at as string).toISOString().slice(0, 10))
  ).size
  const avgEarnings = completedRideEarnings.length > 0
    ? completedRideEarnings.reduce((sum, amount) => sum + amount, 0) / Math.max(1, activeDays)
    : 0

  const stats: StatItem[] = [
    {
      label: 'Trips Today',
      value: todayTrips,
      subBadge: `${weekTrips} completed in the last 7 days`,
    },
    {
      label: 'Total Trips',
      value: driver.total_trips.toLocaleString(),
      subBadge: `${driver.completed_trips.toLocaleString()} Completed Trips`,
      subText: `${driver.cancelled_trips} Canceled`,
    },
    {
      label: 'Avg Earnings / Day',
      value: formatTZS(avgEarnings),
      subBadge: `${completionRate}% Completion Rate`,
    },
  ]

  return (
    <div className="w-full flex flex-col gap-4">
      <DriverDetailHeader driver={driver} adminUser={adminUser} />

      {driver.status === 'pending' && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <span className="text-amber-500 text-lg leading-none mt-0.5">⚠</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Application pending review</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Review the driver&apos;s personal information, national ID, vehicle details and photos below,
              then use the <strong>Approve</strong> or <strong>Reject</strong> buttons above.
            </p>
          </div>
        </div>
      )}

      {driver.status === 'inactive' && (
        <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
          <span className="text-slate-500 text-lg leading-none mt-0.5">●</span>
          <div>
            <p className="text-sm font-semibold text-slate-800">Driver marked inactive</p>
            <p className="text-xs text-slate-600 mt-0.5">
              This driver has been offline for more than 30 days based on the latest activity timestamp stored in the database.
            </p>
          </div>
        </div>
      )}

      {driver.status === 'banned' && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <span className="text-red-500 text-lg leading-none mt-0.5">●</span>
          <div>
            <p className="text-sm font-semibold text-red-800">Driver is banned</p>
            <p className="text-xs text-red-700 mt-0.5">
              {driver.banned_reason ? `Reason: ${driver.banned_reason}` : 'This driver has been removed from the active driver pool.'}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-start">
        <div className="w-[342px] shrink-0">
          <DriverProfileCard driver={driver} />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <StatsRow stats={stats} />

          <div className="grid grid-cols-3 gap-4 items-stretch">
            <div className="col-span-2">
              <DriverPersonalInfo driver={driver} documents={documents} />
            </div>
            <DriverSubscriptionCard driver={driver} lastPayment={lastPayment} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <DriverVehicleInfo driver={driver} />
            </div>
            <div className="col-span-2">
              <DriverVehicleGallery driver={driver} />
            </div>
          </div>

          <DriverRideHistory rides={rides} />
        </div>
      </div>
    </div>
  )
}
