import { getDriverById } from '@/lib/queries/drivers'
import { getAdminUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { DriverDetailHeader } from '@/components/drivers/DriverDetailHeader'
import { DriverPersonalInfo } from '@/components/drivers/DriverPersonalInfo'
import { DriverVehicleInfo } from '@/components/drivers/DriverVehicleInfo'
import { DriverSubscriptionCard } from '@/components/drivers/DriverSubscriptionCard'
import { DriverRideHistory } from '@/components/drivers/DriverRideHistory'
import { DriverAdminActions } from '@/components/drivers/DriverAdminActions'

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [adminUser, result] = await Promise.all([getAdminUser(), getDriverById(id).catch(() => null)])

  if (!result) notFound()
  const { driver, documents, rides } = result

  return (
    <div className="max-w-5xl space-y-6">
      <DriverDetailHeader driver={driver} adminRole={adminUser.role} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <DriverPersonalInfo driver={driver} documents={documents} />
          <DriverVehicleInfo driver={driver} />
          <DriverRideHistory rides={rides} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <DriverSubscriptionCard driver={driver} />
          <DriverAdminActions driver={driver} adminUser={adminUser} />
        </div>
      </div>
    </div>
  )
}
