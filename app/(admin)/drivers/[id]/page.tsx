import { getDriverById } from '@/lib/queries/drivers'
import { getAdminUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { DriverDetailHeader } from '@/components/drivers/DriverDetailHeader'
import { DriverProfileCard } from '@/components/drivers/DriverProfileCard'
import { DriverSubscriptionCard } from '@/components/drivers/DriverSubscriptionCard'
import { DriverVehicleGallery } from '@/components/drivers/DriverVehicleGallery'
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

  if (!result) notFound()

  const { driver, rides, todayTrips, lastPayment } = result

  const completionRate = driver.total_trips > 0
    ? Math.round((driver.completed_trips / driver.total_trips) * 100)
    : 0

  // Average daily earnings: total earnings from rides / days since joining
  const totalEarnings = rides
    .filter(r => r.status === 'completed')
    .reduce((s, r) => s + ((r as { driver_earnings_tzs?: number | null }).driver_earnings_tzs ?? 0), 0)
  const joinedAt     = driver.joined_at ?? driver.created_at
  const daysActive   = Math.max(1, Math.floor((Date.now() - new Date(joinedAt).getTime()) / 86_400_000))
  const avgEarnings  = Math.round(totalEarnings / daysActive)

  const stats: StatItem[] = [
    {
      label: 'Trips Today',
      value: todayTrips,
      subBadge: driver.last_active_at
        ? `Active ${Math.round((Date.now() - new Date(driver.last_active_at).getTime()) / 60_000)} min ago`
        : 'No recent activity',
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

      <div className="flex gap-4 items-start">
        {/* Left — profile card */}
        <div className="w-[342px] shrink-0">
          <DriverProfileCard driver={driver} />
        </div>

        {/* Right — stats + subscription + vehicle + rides */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <StatsRow stats={stats} />

          <div className="grid grid-cols-3 gap-4">
            <DriverSubscriptionCard driver={driver} lastPayment={lastPayment} />
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
