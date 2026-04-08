import { getRides } from '@/lib/queries/rides'
import { createAdminClient } from '@/lib/supabase/server'
import { RidesTable } from '@/components/rides/RidesTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsRow } from '@/components/ui/StatsRow'
import { formatTZS } from '@/lib/utils'
import type { RideStatus } from '@/lib/types'
import type { StatItem } from '@/components/ui/StatsRow'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function settled(r: PromiseSettledResult<any>, fallback: any) {
  return r.status === 'fulfilled' ? r.value : fallback
}

const MOCK_STATS: StatItem[] = [
  { label: 'Live Rides',      value: 47,         subBadge: 'Real-time', subText: 'updated live' },
  { label: 'Completed Today', value: 312,        subBadge: '+12%',      subText: 'vs yesterday' },
  { label: 'Cancelled Today', value: 18,         subBadge: '5.4%',      subText: 'cancellation rate' },
  { label: "Today's Revenue", value: 'TZS 2.4M', subBadge: 'Today',     subText: 'commission + subscriptions' },
]

export default async function RidesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const params = await searchParams
  const tab  = params.tab ?? 'live'
  const page = Number(params.page ?? 1)

  const tabConfig: Record<string, { status?: RideStatus | RideStatus[]; flagged?: boolean }> = {
    live:      { status: ['requested', 'accepted', 'ongoing'] },
    history:   { status: 'completed' },
    cancelled: { status: 'cancelled' },
    flagged:   { flagged: true },
  }

  const today    = new Date().toISOString().split('T')[0]
  const supabase = createAdminClient()

  const [ridesResult, liveR, completedR, cancelledR, revenueR] = await Promise.allSettled([
    getRides({ ...tabConfig[tab] ?? tabConfig.live, page }),
    supabase.from('rides').select('*', { count: 'exact', head: true }).in('status', ['requested', 'accepted', 'ongoing']),
    supabase.from('rides').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('completed_at', today),
    supabase.from('rides').select('*', { count: 'exact', head: true }).eq('status', 'cancelled').gte('requested_at', today),
    supabase.from('rides').select('driver_earnings_tzs').eq('status', 'completed').gte('completed_at', today),
  ])

  const { rides, total } = settled(ridesResult, { rides: [], total: 0 })
  const liveCount      = settled(liveR,      { count: 0 }).count ?? 0
  const completedToday = settled(completedR, { count: 0 }).count ?? 0
  const cancelledToday = settled(cancelledR, { count: 0 }).count ?? 0
  const revenueRows    = settled(revenueR,   { data: [] }).data ?? []
  const todayRevenue   = (revenueRows as Record<string, number | null>[]).reduce((s, r) => s + (r.driver_earnings_tzs ?? 0), 0)

  const cancelPct = (completedToday + cancelledToday) > 0
    ? Math.round(cancelledToday / (completedToday + cancelledToday) * 100) : 0
  const useMock = liveCount === 0 && completedToday === 0
  const stats: StatItem[] = useMock ? MOCK_STATS : [
    { label: 'Live Rides',      value: liveCount,               subBadge: 'Live',         subText: 'updated in real-time' },
    { label: 'Completed Today', value: completedToday,          subBadge: 'Today',        subText: 'since midnight' },
    { label: 'Cancelled Today', value: cancelledToday,          subBadge: `${cancelPct}%`, subText: 'cancellation rate' },
    { label: "Today's Revenue", value: formatTZS(todayRevenue), subBadge: 'Earnings',     subText: 'driver earnings' },
  ]

  const TABS = [
    { key: 'live',      label: 'Live Rides' },
    { key: 'history',   label: 'Ride History' },
    { key: 'cancelled', label: 'Cancelled Rides' },
    { key: 'flagged',   label: 'Flagged Rides' },
  ]

  return (
    <div className="space-y-4 w-full">
      <PageHeader title="Rides" tabs={TABS} activeTab={tab} basePath="/rides" />
      <StatsRow stats={stats} />
      <RidesTable rides={rides} total={total} page={page} tab={tab} tabs={TABS} isLive={tab === 'live'} />
    </div>
  )
}
