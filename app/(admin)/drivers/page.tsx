import { getDrivers } from '@/lib/queries/drivers'
import { DriversTable } from '@/components/drivers/DriversTable'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; search?: string }>
}) {
  const params = await searchParams
  const tab    = params.tab ?? 'all'
  const page   = Number(params.page ?? 1)
  const search = params.search

  let drivers: Awaited<ReturnType<typeof getDrivers>>['drivers'] = []
  let total = 0
  try {
    const result = await getDrivers({
      status: tab === 'all' ? undefined : tab as Parameters<typeof getDrivers>[0]['status'],
      page,
      search,
    })
    drivers = result.drivers
    total = result.total
  } catch {
    // backend may not be reachable
  }

  const TABS = [
    { key: 'all',       label: 'All Drivers' },
    { key: 'active',    label: 'Active Drivers' },
    { key: 'pending',   label: 'Pending Approval' },
    { key: 'inactive',  label: 'Inactive Drivers' },
    { key: 'banned',    label: 'Banned Drivers' },
    { key: 'suspended', label: 'Suspended Drivers' },
    { key: 'churned',   label: 'Rejected Drivers' },
  ]

  return (
    <div className="space-y-4 w-full">
      <PageHeader title="Drivers" tabs={TABS} activeTab={tab} basePath="/drivers" />
      <DriversTable drivers={drivers} total={total} page={page} tab={tab} tabs={TABS} search={search} />
    </div>
  )
}
