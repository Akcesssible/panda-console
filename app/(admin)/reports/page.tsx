import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { ReportsView } from '@/components/reports/ReportsView'
import { PageHeader } from '@/components/ui/PageHeader'

async function getReportData(tab: string) {
  const supabase = createAdminClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  if (tab === 'drivers') {
    const { data } = await supabase
      .from('drivers')
      .select('id, full_name, driver_number, total_trips, completed_trips, cancelled_trips, rating, last_active_at, zones(name)')
      .order('total_trips', { ascending: false })
      .limit(100)
    return { rows: data ?? [], summary: {} }
  }

  if (tab === 'rides') {
    const [{ count: total }, { count: completed }, { count: cancelled }, { data: fares }] = await Promise.all([
      supabase.from('rides').select('*', { count: 'exact', head: true }),
      supabase.from('rides').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('rides').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
      supabase.from('rides').select('total_fare_tzs, duration_minutes').eq('status', 'completed'),
    ])
    const totalFare = (fares ?? []).reduce((s: number, r: Record<string, number | null>) => s + (r.total_fare_tzs ?? 0), 0)
    const avgFare = fares?.length ? totalFare / fares.length : 0
    return { rows: [], summary: { total, completed, cancelled, totalFare, avgFare } }
  }

  if (tab === 'revenue') {
    const [{ data: subPayments }, { data: commissions }] = await Promise.all([
      supabase.from('subscription_payments').select('amount_tzs, provider, created_at').eq('status', 'completed').gte('created_at', thirtyDaysAgo),
      supabase.from('rides').select('commission_tzs, completed_at').eq('status', 'completed').gte('completed_at', thirtyDaysAgo),
    ])
    const subRevenue = (subPayments ?? []).reduce((s: number, p: Record<string, number | null>) => s + (p.amount_tzs ?? 0), 0)
    const commRevenue = (commissions ?? []).reduce((s: number, r: Record<string, number | null>) => s + (r.commission_tzs ?? 0), 0)
    return { rows: subPayments ?? [], summary: { subRevenue, commRevenue, total: subRevenue + commRevenue } }
  }

  if (tab === 'churn') {
    const { data } = await supabase
      .from('drivers')
      .select('id, full_name, driver_number, last_active_at, churn_reason, total_trips')
      .eq('status', 'churned')
      .order('last_active_at', { ascending: false })
    return { rows: data ?? [], summary: { total: data?.length ?? 0 } }
  }

  return { rows: [], summary: {} }
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams
  const tab = params.tab ?? 'drivers'
  const [, data] = await Promise.all([getAdminUser(), getReportData(tab)])

  const TABS = [
    { key: 'drivers', label: 'Driver Performance' },
    { key: 'rides', label: 'Ride Analytics' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'churn', label: 'Churn Analysis' },
  ]

  return (
    <div className="space-y-4 max-w-7xl">
      <PageHeader
        title="Reports"
        subtitle="Read-only analytics and performance reports"
        tabs={TABS}
        activeTab={tab}
        basePath="/reports"
      />
      <ReportsView tab={tab} rows={data.rows} summary={data.summary} />
    </div>
  )
}
