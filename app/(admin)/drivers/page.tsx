import { getDrivers } from '@/lib/queries/drivers'
import { createAdminClient } from '@/lib/supabase/server'
import { DriversTable } from '@/components/drivers/DriversTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsRow } from '@/components/ui/StatsRow'
import type { StatItem } from '@/components/ui/StatsRow'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function settled(r: PromiseSettledResult<any>, fallback: any) {
  return r.status === 'fulfilled' ? r.value : fallback
}

const MOCK_STATS: StatItem[] = [
  { label: 'Total Drivers',     value: 4218, sub: '+421 trips vs yesterday' },
  { label: 'Active Drivers',    value: 3102, sub: 'Kinondoni · Highest Earning Zone' },
  { label: 'Pending Approval',  value: 23,   sub: '842 of 1,168 drivers subscribed' },
  { label: 'Churned Drivers',   value: 441,  sub: 'Inactive from platform' },
]

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; search?: string }>
}) {
  const params = await searchParams
  const tab    = params.tab ?? 'all'
  const page   = Number(params.page ?? 1)
  const search = params.search

  const statusMap: Record<string, Parameters<typeof getDrivers>[0]['status']> = {
    all: undefined, active: 'active', pending: 'pending', suspended: 'suspended', churned: 'churned',
  }

  const supabase = createAdminClient()

  const [driversResult, totalR, activeR, pendingR, churnedR] = await Promise.allSettled([
    getDrivers({ status: statusMap[tab], page, search }),
    supabase.from('drivers').select('*', { count: 'exact', head: true }),
    supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'churned'),
  ])

  const { drivers, total } = settled(driversResult, { drivers: [], total: 0 })
  const totalDrivers   = settled(totalR,   { count: 0 }).count ?? 0
  const activeDrivers  = settled(activeR,  { count: 0 }).count ?? 0
  const pendingDrivers = settled(pendingR, { count: 0 }).count ?? 0
  const churnedDrivers = settled(churnedR, { count: 0 }).count ?? 0

  const useMock = totalDrivers === 0
  const stats: StatItem[] = useMock ? MOCK_STATS : [
    { label: 'Total Drivers',    value: totalDrivers,   sub: 'Registered on platform' },
    { label: 'Active Drivers',   value: activeDrivers,  sub: `${totalDrivers ? Math.round(activeDrivers / totalDrivers * 100) : 0}% of total fleet` },
    { label: 'Pending Approval', value: pendingDrivers, sub: 'Awaiting verification' },
    { label: 'Churned Drivers',  value: churnedDrivers, sub: 'Inactive from platform' },
  ]

  const TABS = [
    { key: 'all',       label: 'All Drivers' },
    { key: 'active',    label: 'Active Drivers' },
    { key: 'pending',   label: 'Pending Approval' },
    { key: 'suspended', label: 'Suspended Drivers' },
    { key: 'churned',   label: 'Churned Drivers' },
  ]

  return (
    <div className="space-y-4 max-w-7xl">
      <PageHeader title="Drivers" tabs={TABS} activeTab={tab} basePath="/drivers" />
      <StatsRow stats={stats} />
      <DriversTable drivers={drivers} total={total} page={page} tab={tab} tabs={TABS} search={search} />
    </div>
  )
}
