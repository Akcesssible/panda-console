import { getRides } from '@/lib/queries/rides'
import { RidesTable } from '@/components/rides/RidesTable'
import type { RideStatus } from '@/lib/types'

export default async function RidesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const params = await searchParams
  const tab = params.tab ?? 'live'
  const page = Number(params.page ?? 1)

  const tabConfig: Record<string, { status?: RideStatus | RideStatus[]; flagged?: boolean }> = {
    live: { status: ['requested', 'accepted', 'ongoing'] },
    history: { status: 'completed' },
    cancelled: { status: 'cancelled' },
    flagged: { flagged: true },
  }

  const config = tabConfig[tab] ?? tabConfig.live
  const { rides, total } = await getRides({ ...config, page })

  const TABS = [
    { key: 'live', label: 'Live Rides' },
    { key: 'history', label: 'Ride History' },
    { key: 'cancelled', label: 'Cancelled Rides' },
    { key: 'flagged', label: 'Flagged Rides' },
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Rides</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monitor and manage all rides</p>
      </div>
      <RidesTable rides={rides} total={total} page={page} tab={tab} tabs={TABS} isLive={tab === 'live'} />
    </div>
  )
}
