import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { EarningTrendCard } from '@/components/dashboard/EarningTrendCard'
import { ChurnRateCard } from '@/components/dashboard/ChurnRateCard'
import { ActionAlertCard } from '@/components/dashboard/ActionAlertCard'
import { RecentActivityTable } from '@/components/dashboard/RecentActivityTable'
import { StatsRow } from '@/components/ui/StatsRow'
import { formatTZS } from '@/lib/utils'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import type { StatItem } from '@/components/ui/StatsRow'

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

const MOCK_STATS: StatItem[] = [
  { label: 'Active Drivers',    value: 3102, subBadge: '+6.3%',      subText: 'vs yesterday' },
  { label: 'Completed Trips',   value: 312,  subBadge: '+421 trips',  subText: 'vs yesterday' },
  { label: 'Active Subscriptions', value: 842, subBadge: '842 of 1,168', subText: 'drivers subscribed' },
  { label: "Today's Earnings",  value: 'TZS 2.4M', subBadge: 'Today', subText: 'driver earnings' },
]

export default async function DashboardPage() {
  const [adminUser, data] = await Promise.all([getAdminUser(), getDashboardData()])
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const conversionPct = data.subscriptionConversionRate
  const useMock = data.totalDrivers === 0
  const stats: StatItem[] = useMock ? MOCK_STATS : [
    { label: 'Active Drivers',       value: data.activeDrivers,       subBadge: '+6.3%',               subText: 'vs yesterday' },
    { label: 'Completed Trips',      value: data.completedToday,      subBadge: 'Today',               subText: 'since midnight' },
    { label: 'Active Subscriptions', value: data.activeSubscriptions, subBadge: `${conversionPct}%`,   subText: 'subscription rate' },
    { label: "Today's Earnings",     value: formatTZS(data.avgEarningsPerDriver * data.activeDrivers), subBadge: 'Today', subText: 'driver earnings' },
  ]

  return (
    <div className="space-y-3 w-full">
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

      {/* Stats row — identical to all section pages */}
      <StatsRow stats={stats} />

      {/* Top row — 2 equal columns */}
      <div className="grid grid-cols-2 gap-3">
        <EarningTrendCard />
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
