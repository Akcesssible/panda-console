import { getDriverById } from '@/lib/queries/drivers'
import { getAdminUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { DriverDetailHeader } from '@/components/drivers/DriverDetailHeader'
import { DriverProfileCard } from '@/components/drivers/DriverProfileCard'
import { DriverStats } from '@/components/drivers/DriverStats'
import { DriverSubscriptionCard } from '@/components/drivers/DriverSubscriptionCard'
import { DriverVehicleGallery } from '@/components/drivers/DriverVehicleGallery'
import { DriverRideHistory } from '@/components/drivers/DriverRideHistory'

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

  return (
    <div className="w-full flex flex-col gap-4">
      <DriverDetailHeader driver={driver} adminUser={adminUser} />

      <div className="flex gap-4 items-start">
        {/* Left — profile card */}
        <div className="w-72 shrink-0">
          <DriverProfileCard driver={driver} />
        </div>

        {/* Right — stats + subscription + vehicle + rides */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <DriverStats driver={driver} todayTrips={todayTrips} />

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
