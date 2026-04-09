import { getCommissionRides, getCommissionStats } from '@/lib/queries/commissions'
import { CommissionsView } from '@/components/commissions/CommissionsView'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsRow } from '@/components/ui/StatsRow'
import { formatTZS } from '@/lib/utils'
import type { StatItem } from '@/components/ui/StatsRow'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function settled(r: PromiseSettledResult<any>, fallback: any) {
  return r.status === 'fulfilled' ? r.value : fallback
}

const MOCK_STATS: StatItem[] = [
  { label: 'This Month',       value: 'TZS 28,700', subBadge: 'April 2026',   subText: 'commission collected' },
  { label: 'Today',            value: 'TZS 2,400',  subBadge: 'Live',         subText: 'commission today' },
  { label: 'Commission Rides', value: 6,             subBadge: '6 rides',      subText: 'non-subscriber rides' },
  { label: 'Avg per Ride',     value: 'TZS 4,783',  subBadge: '20% rate',     subText: 'average commission' },
]

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page   = Number(params.page ?? 1)

  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [commissionsResult, commissionStatsResult] = await Promise.allSettled([
    getCommissionRides({ page }),
    getCommissionStats(firstOfMonth),
  ])

  const commStats = settled(commissionStatsResult, { monthRevenue: 0, todayRevenue: 0, totalRides: 0 })
  const { rides, total } = settled(commissionsResult, { rides: [], total: 0 })

  const useMock = commStats.totalRides === 0 && rides.length === 0

  const avgPerRide = commStats.totalRides > 0
    ? Math.round(commStats.monthRevenue / commStats.totalRides)
    : 0

  const stats: StatItem[] = useMock ? MOCK_STATS : [
    { label: 'This Month',       value: formatTZS(commStats.monthRevenue), subBadge: 'This month',               subText: 'commission collected' },
    { label: 'Today',            value: formatTZS(commStats.todayRevenue), subBadge: 'Today',                    subText: 'commission today' },
    { label: 'Commission Rides', value: commStats.totalRides,              subBadge: `${commStats.totalRides}`,  subText: 'non-subscriber rides' },
    { label: 'Avg per Ride',     value: formatTZS(avgPerRide),             subBadge: '20% rate',                 subText: 'average commission' },
  ]

  return (
    <div className="space-y-4 w-full">
      <PageHeader
        title="Commission Revenue"
        subtitle="Rides by non-subscribed drivers — 20% platform fee"
      />
      <StatsRow stats={stats} />
      <CommissionsView
        commissions={rides}
        commissionsTotal={total}
        page={page}
        useMock={useMock}
      />
    </div>
  )
}
