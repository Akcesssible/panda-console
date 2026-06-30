import { getRides } from '@/lib/queries/rides'
import { RidesTable } from '@/components/rides/RidesTable'
import { PageHeader } from '@/components/ui/PageHeader'
import type { RideStatus } from '@/lib/types'

export default async function RidesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; search?: string }>
}) {
  const params = await searchParams
  const tab    = params.tab ?? 'live'
  const page   = Number(params.page ?? 1)
  const search = params.search

  const tabConfig: Record<string, { status?: RideStatus | RideStatus[]; flagged?: boolean }> = {
    live:      { status: ['requested', 'accepted', 'ongoing'] },
    history:   { status: 'completed' },
    cancelled: { status: 'cancelled' },
    flagged:   { flagged: true },
  }

  let rides: Awaited<ReturnType<typeof getRides>>['rides'] = []
  let total = 0
  try {
    const result = await getRides({ ...tabConfig[tab] ?? tabConfig.live, page, search })
    rides = result.rides
    total = result.total
  } catch {
    // backend may not be reachable
  }

  const TABS = [
    { key: 'live',      label: 'Live Rides' },
    { key: 'history',   label: 'Ride History' },
    { key: 'cancelled', label: 'Cancelled Rides' },
    { key: 'flagged',   label: 'Flagged Rides' },
  ]

  return (
    <div className="space-y-4 w-full">
      <PageHeader title="Rides" tabs={TABS} activeTab={tab} basePath="/rides" />
      <RidesTable rides={rides} total={total} page={page} tab={tab} tabs={TABS} isLive={tab === 'live'} search={search} />
    </div>
  )
}
