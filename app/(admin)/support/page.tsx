import { getTickets } from '@/lib/queries/support'
import { SupportTable } from '@/components/support/SupportTable'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const params = await searchParams
  const tab = params.tab ?? 'open'
  const page = Number(params.page ?? 1)

  const statusMap: Record<string, string | string[] | undefined> = {
    open: 'open',
    in_progress: 'in_progress',
    resolved: ['resolved', 'closed'],
    all: undefined,
  }

  const { tickets, total } = await getTickets({ status: statusMap[tab], page })

  const TABS = [
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'all', label: 'All Tickets' },
  ]

  return (
    <div className="space-y-4 max-w-6xl">
      <PageHeader
        title="Support"
        subtitle="Manage disputes and support tickets"
        tabs={TABS}
        activeTab={tab}
        basePath="/support"
      />
      <SupportTable tickets={tickets} total={total} page={page} tab={tab} tabs={TABS} />
    </div>
  )
}
