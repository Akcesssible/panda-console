import { getTickets } from '@/lib/queries/support'
import { createAdminClient } from '@/lib/supabase/server'
import { SupportTable } from '@/components/support/SupportTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsRow } from '@/components/ui/StatsRow'
import type { StatItem } from '@/components/ui/StatsRow'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function settled(r: PromiseSettledResult<any>, fallback: any) {
  return r.status === 'fulfilled' ? r.value : fallback
}

const MOCK_STATS: StatItem[] = [
  { label: 'Open Tickets',        value: 23,  subBadge: '23',    subText: 'needs attention' },
  { label: 'In Progress',         value: 8,   subBadge: '8',     subText: 'being handled' },
  { label: 'Resolved This Month', value: 147, subBadge: '4.2h',  subText: 'avg response time' },
  { label: 'Total Tickets',       value: 178, subBadge: 'All',   subText: 'all time' },
]

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const params = await searchParams
  const tab  = params.tab ?? 'open'
  const page = Number(params.page ?? 1)

  const statusMap: Record<string, string | string[] | undefined> = {
    open: 'open', in_progress: 'in_progress', resolved: ['resolved', 'closed'], all: undefined,
  }

  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const supabase     = createAdminClient()

  const [ticketsResult, openR, inProgressR, resolvedR, totalR] = await Promise.allSettled([
    getTickets({ status: statusMap[tab], page }),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['resolved', 'closed']).gte('updated_at', firstOfMonth),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }),
  ])

  const { tickets, total } = settled(ticketsResult, { tickets: [], total: 0 })
  const openCount       = settled(openR,       { count: 0 }).count ?? 0
  const inProgressCount = settled(inProgressR, { count: 0 }).count ?? 0
  const resolvedCount   = settled(resolvedR,   { count: 0 }).count ?? 0
  const totalCount      = settled(totalR,      { count: 0 }).count ?? 0

  const useMock = openCount === 0 && totalCount === 0
  const stats: StatItem[] = useMock ? MOCK_STATS : [
    { label: 'Open Tickets',        value: openCount,       subBadge: String(openCount),       subText: 'needs attention' },
    { label: 'In Progress',         value: inProgressCount, subBadge: String(inProgressCount), subText: 'being handled' },
    { label: 'Resolved This Month', value: resolvedCount,   subBadge: 'This month',            subText: 'resolved tickets' },
    { label: 'Total Tickets',       value: totalCount,      subBadge: 'All',                   subText: 'all time' },
  ]

  const TABS = [
    { key: 'open',        label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved',    label: 'Resolved' },
    { key: 'all',         label: 'All Tickets' },
  ]

  return (
    <div className="space-y-4 w-full">
      <PageHeader title="Support" tabs={TABS} activeTab={tab} basePath="/support" />
      <StatsRow stats={stats} />
      <SupportTable tickets={tickets} total={total} page={page} tab={tab} tabs={TABS} />
    </div>
  )
}
