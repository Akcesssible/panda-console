import { getAdminUser } from '@/lib/auth'
import { ReportsView } from '@/components/reports/ReportsView'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams
  const tab = params.tab ?? 'drivers'
  await getAdminUser()

  const TABS = [
    { key: 'drivers', label: 'Driver Performance' },
    { key: 'rides',   label: 'Ride Analytics' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'churn',   label: 'Churn Analysis' },
  ]

  return (
    <div className="space-y-4 w-full">
      <PageHeader
        title="Reports"
        subtitle="Read-only analytics and performance reports"
        tabs={TABS}
        activeTab={tab}
        basePath="/reports"
      />
      <ReportsView tab={tab} rows={[]} summary={{}} />
    </div>
  )
}
