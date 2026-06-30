import { getRiders } from '@/lib/queries/riders'
import { RidersTable } from '@/components/riders/RidersTable'
import { PageHeader } from '@/components/ui/PageHeader'
import type { RiderStatus } from '@/lib/types'

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
    all: undefined, active: 'active', inactive: 'inactive', banned: 'banned',
  }

  const { riders, total } = await getRiders({ status: statusMap[tab], page, search })

  const TABS = [
    { key: 'all',      label: 'All Riders' },
    { key: 'active',   label: 'Active Riders' },
    { key: 'inactive', label: 'Inactive Riders' },
    { key: 'banned',   label: 'Banned Riders' },
  ]

  return (
    <div className="space-y-4 w-full">
      <PageHeader title="Riders" tabs={TABS} activeTab={tab} basePath="/riders" />
      <RidersTable riders={riders} total={total} page={page} tab={tab} tabs={TABS} search={search} />
    </div>
  )
}
