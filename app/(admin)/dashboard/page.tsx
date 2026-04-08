import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { EarningTrendCard } from '@/components/dashboard/EarningTrendCard'
import { ActiveDriversCluster } from '@/components/dashboard/ActiveDriversCluster'
import { ChurnRateCard } from '@/components/dashboard/ChurnRateCard'
import { ActionAlertCard } from '@/components/dashboard/ActionAlertCard'
import { RecentActivityTable } from '@/components/dashboard/RecentActivityTable'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function settled(result: PromiseSettledResult<any>, fallback: any): any {
  return result.status === 'fulfilled' ? result.value : fallback
}

async function getDashboardData() {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const results = await Promise.allSettled([
    supabase.from('drivers').select('*', { count: 'exact', head: true }),
    supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('rides').select('*', { count: 'exact', head: true })
      .eq('status', 'completed').gte('completed_at', today),
    supabase.from('rides').select('driver_earnings_tzs')
      .eq('status', 'completed').gte('completed_at', today),
    supabase.from('driver_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
    supabase.from('driver_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
    supabase.rpc('get_7day_earnings_trend'),
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20),
  ])

  const totalDrivers        = settled(results[0], { count: 0 }).count ?? 0
  const activeDrivers       = settled(results[1], { count: 0 }).count ?? 0
  const pendingDrivers      = settled(results[2], { count: 0 }).count ?? 0
  const completedToday      = settled(results[3], { count: 0 }).count ?? 0
  const todayEarnings       = settled(results[4], { data: [] }).data ?? []
  const activeSubscriptions = settled(results[5], { count: 0 }).count ?? 0
  const expiredSubs         = settled(results[7], { count: 0 }).count ?? 0
  const recentActivity      = settled(results[9], { data: [] }).data ?? []

  const totalEarningsToday = (todayEarnings as Record<string, number | null>[]).reduce(
    (sum, r) => sum + (r.driver_earnings_tzs ?? 0), 0
  )
  const avgEarningsPerDriver = activeDrivers > 0 ? totalEarningsToday / activeDrivers : 0
  const subscriptionConversionRate = activeDrivers > 0
    ? Math.round((activeSubscriptions / activeDrivers) * 100) : 0

  return {
    totalDrivers, activeDrivers, pendingDrivers, completedToday,
    avgEarningsPerDriver, subscriptionConversionRate, activeSubscriptions,
    expiredSubs, recentActivity,
  }
}

export default async function DashboardPage() {
  const [adminUser, data] = await Promise.all([getAdminUser(), getDashboardData()])
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
          activeDrivers={data.activeDrivers}
          completedToday={data.completedToday}
          avgEarningsPerDriver={data.avgEarningsPerDriver}
          subscriptionConversionRate={data.subscriptionConversionRate}
          activeSubscriptions={data.activeSubscriptions}
          totalDrivers={data.totalDrivers}
        />
        <ChurnRateCard />
      </div>

      {/* Bottom row — left narrow (alerts) + right wide (activity) */}
      <div className="grid grid-cols-3 gap-3">
        {/* Left column — stacked alert cards */}
        <div className="flex flex-col gap-3">
          <ActionAlertCard
            title="Drivers Pending Approval"
            count={data.pendingDrivers}
            unit="Drivers"
            description="New drivers awaiting verification"
            ctaLabel="Verify Driver"
            ctaHref="/drivers?tab=pending"
          />
          <ActionAlertCard
            title="Expired Subscriptions"
            count={data.expiredSubs}
            unit="Subs"
            description="Subscriptions need renewal"
            ctaLabel="Notify Drivers"
            ctaHref="/subscriptions?tab=expired"
          />
        </div>

        {/* Right column — recent activity */}
        <div className="col-span-2">
          <RecentActivityTable initialLogs={data.recentActivity as any[]} />
        </div>
      </div>
    </div>
  )
}
