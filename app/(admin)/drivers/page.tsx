import { getDrivers } from '@/lib/queries/drivers'
import { DriversTable } from '@/components/drivers/DriversTable'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; search?: string }>
}) {
  const params = await searchParams
  const tab = params.tab ?? 'all'
  const page = Number(params.page ?? 1)
  const search = params.search

  const statusMap: Record<string, Parameters<typeof getDrivers>[0]['status']> = {
    all: undefined,
    active: 'active',
    pending: 'pending',
    suspended: 'suspended',
    churned: 'churned',
  }

  const { drivers, total } = await getDrivers({
    status: statusMap[tab],
    page,
    search,
  })

  const TABS = [
    { key: 'all', label: 'All Drivers' },
    { key: 'active', label: 'Active Drivers' },
    { key: 'pending', label: 'Pending Approval' },
    { key: 'suspended', label: 'Suspended Drivers' },
    { key: 'churned', label: 'Churned Drivers' },
  ]

  return (
    <div className="space-y-4 max-w-7xl">
      <PageHeader
        title="Drivers"
        subtitle="Manage your driver fleet"
        tabs={TABS}
        activeTab={tab}
        basePath="/drivers"
      />
      <DriversTable
        drivers={drivers}
        total={total}
        page={page}
        tab={tab}
        tabs={TABS}
        search={search}
      />
    </div>
  )
}
