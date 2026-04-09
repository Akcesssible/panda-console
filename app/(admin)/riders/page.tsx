import { getRiders } from '@/lib/queries/riders'
import { createAdminClient } from '@/lib/supabase/server'
import { RidersTable } from '@/components/riders/RidersTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsRow } from '@/components/ui/StatsRow'
import type { RiderStatus } from '@/lib/types'
import type { StatItem } from '@/components/ui/StatsRow'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function settled(r: PromiseSettledResult<any>, fallback: any) {
  return r.status === 'fulfilled' ? r.value : fallback
}

const MOCK_STATS: StatItem[] = [
  { label: 'Total Riders',     value: 18_420, subBadge: '+312 this week', subText: 'registered on platform' },
  { label: 'Active Riders',    value: 11_834, subBadge: '64%',            subText: 'rode in last 30 days' },
  { label: 'New This Month',   value: 1_204,  subBadge: '+18%',           subText: 'vs last month' },
  { label: 'Banned Riders',    value: 37,     subBadge: 'Banned',         subText: 'removed from platform' },
]

export default async function RidersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; search?: string }>
}) {
  const params = await searchParams
  const tab    = params.tab    ?? 'all'
  const page   = Number(params.page ?? 1)
  const search = params.search

  const statusMap: Record<string, RiderStatus | undefined> = {
    all:      undefined,
    active:   'active',
    inactive: 'inactive',
    banned:   'banned',
  }

  const supabase = createAdminClient()

  // 30 days ago for "active" definition
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const [ridersResult, totalR, activeR, newMonthR, bannedR] = await Promise.allSettled([
    getRiders({ status: statusMap[tab], page, search }),
    supabase.from('riders').select('*', { count: 'exact', head: true }),
    supabase.from('riders').select('*', { count: 'exact', head: true }).gte('last_ride_at', thirtyDaysAgo),
    supabase.from('riders').select('*', { count: 'exact', head: true }).gte('registered_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from('riders').select('*', { count: 'exact', head: true }).eq('status', 'banned'),
  ])

  const { riders, total } = settled(ridersResult, { riders: [], total: 0 })
  const totalRiders  = settled(totalR,    { count: 0 }).count ?? 0
  const activeRiders = settled(activeR,   { count: 0 }).count ?? 0
  const newThisMonth = settled(newMonthR, { count: 0 }).count ?? 0
  const bannedRiders = settled(bannedR,   { count: 0 }).count ?? 0

  const useMock   = totalRiders === 0
  const activePct = totalRiders ? Math.round(activeRiders / totalRiders * 100) : 0

  const stats: StatItem[] = useMock ? MOCK_STATS : [
    { label: 'Total Riders',   value: totalRiders,  subBadge: 'Total',         subText: 'registered on platform' },
    { label: 'Active Riders',  value: activeRiders, subBadge: `${activePct}%`, subText: 'rode in last 30 days' },
    { label: 'New This Month', value: newThisMonth, subBadge: 'This month',    subText: 'new registrations' },
    { label: 'Banned Riders',  value: bannedRiders, subBadge: 'Banned',        subText: 'removed from platform' },
  ]

  const TABS = [
    { key: 'all',      label: 'All Riders' },
    { key: 'active',   label: 'Active Riders' },
    { key: 'inactive', label: 'Inactive Riders' },
    { key: 'banned',   label: 'Banned Riders' },
  ]

  return (
    <div className="space-y-4 w-full">
      <PageHeader title="Riders" tabs={TABS} activeTab={tab} basePath="/riders" />
      <StatsRow stats={stats} />
      <RidersTable riders={riders} total={total} page={page} tab={tab} tabs={TABS} search={search} useMock={useMock} />
    </div>
  )
}
