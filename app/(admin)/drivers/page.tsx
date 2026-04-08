import { getDrivers } from '@/lib/queries/drivers'
import { DriversTable } from '@/components/drivers/DriversTable'

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
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Drivers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your driver fleet</p>
        </div>
      </div>

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
