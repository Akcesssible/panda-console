import { getAdminUser } from '@/lib/auth'
import { EarningTrendCard } from '@/components/dashboard/EarningTrendCard'
import { ActiveDriversCluster } from '@/components/dashboard/ActiveDriversCluster'
import { ChurnRateCard } from '@/components/dashboard/ChurnRateCard'
import { ActionAlertCard } from '@/components/dashboard/ActionAlertCard'
import { RecentActivityTable } from '@/components/dashboard/RecentActivityTable'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpRight01Icon } from '@hugeicons-pro/core-stroke-rounded'

export default async function DashboardPage() {
  const adminUser = await getAdminUser()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-3 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-medium text-[#1d242d] tracking-[-1px]">
            {greeting}, {adminUser.full_name.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Real-time operational snapshot</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/rides"
            className="flex items-center gap-4 text-base font-medium text-[#1d242d] bg-white rounded-full p-4 hover:bg-gray-50 transition-colors"
          >
            Live Rides
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} color="#1d242d" strokeWidth={1.5} />
          </Link>
          <Link
            href="/subscriptions?tab=expired"
            className="flex items-center gap-4 text-base font-medium text-[#1d242d] bg-white rounded-full p-4 hover:bg-gray-50 transition-colors"
          >
            Expired Subscriptions
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} color="#1d242d" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* Top row — 3 equal columns */}
      <div className="grid grid-cols-3 gap-3">
        <EarningTrendCard />
        <ActiveDriversCluster
          activeDrivers={0}
          completedToday={0}
          avgEarningsPerDriver={0}
          subscriptionConversionRate={0}
          activeSubscriptions={0}
          totalDrivers={0}
        />
        <ChurnRateCard />
      </div>

      {/* Bottom row — left narrow (alerts) + right wide (activity) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-3">
          <ActionAlertCard
            title="Drivers Pending Approval"
            count={0}
            unit="Drivers"
            description="New drivers awaiting verification"
            ctaLabel="Verify Driver"
            ctaHref="/drivers?tab=pending"
          />
          <ActionAlertCard
            title="Expired Subscriptions"
            count={0}
            unit="Subs"
            description="Subscriptions need renewal"
            ctaLabel="Notify Drivers"
            ctaHref="/subscriptions?tab=expired"
          />
        </div>

        <div className="col-span-2">
          <RecentActivityTable initialLogs={[]} />
        </div>
      </div>
    </div>
  )
}
