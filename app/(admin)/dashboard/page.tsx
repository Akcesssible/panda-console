import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { KPICard } from '@/components/ui/KPICard'
import { EarningsTrendChart } from '@/components/dashboard/EarningsTrendChart'
import { AlertsPanel } from '@/components/dashboard/AlertsPanel'
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed'
import { formatTZS } from '@/lib/utils'

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback
}

async function getDashboardData() {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const results = await Promise.allSettled([
    supabase.from('drivers').select('*', { count: 'exact', head: true }),
    supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('rides').select('*', { count: 'exact', head: true })
      .eq('status', 'completed').gte('completed_at', today),
    supabase.from('rides').select('driver_earnings_tzs')
      .eq('status', 'completed').gte('completed_at', today),
    supabase.from('driver_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
    supabase.from('driver_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
    supabase.rpc('get_7day_earnings_trend'),
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20),
  ])

  const activeDrivers  = settled(results[1], { count: 0 }).count ?? 0
  const pendingDrivers = settled(results[2], { count: 0 }).count ?? 0
  const completedToday = settled(results[3], { count: 0 }).count ?? 0
  const todayEarnings  = settled(results[4], { data: [] }).data ?? []
  const activeSubscriptions = settled(results[5], { count: 0 }).count ?? 0
  const openTickets    = settled(results[6], { count: 0 }).count ?? 0
  const expiredSubs    = settled(results[7], { count: 0 }).count ?? 0
  const earningsTrend  = settled(results[8], { data: [] }).data ?? []
  const recentActivity = settled(results[9], { data: [] }).data ?? []

  const totalEarningsToday = (todayEarnings as Record<string, number | null>[]).reduce(
    (sum: number, r) => sum + (r.driver_earnings_tzs ?? 0), 0
  )
  const avgEarningsPerDriver = activeDrivers > 0 ? totalEarningsToday / activeDrivers : 0
  const subscriptionConversionRate = activeDrivers > 0
    ? Math.round((activeSubscriptions / activeDrivers) * 100)
    : 0

  return {
    kpis: { activeDrivers, completedToday, avgEarningsPerDriver, subscriptionConversionRate, activeSubscriptions },
    alerts: { pendingDrivers, expiredSubs, openTickets },
    earningsTrend,
    recentActivity,
  }
}

export default async function DashboardPage() {
  const [adminUser, data] = await Promise.all([getAdminUser(), getDashboardData()])
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          {greeting}, {adminUser.full_name.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Real-time operational snapshot</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Daily Active Drivers"
          value={data.kpis.activeDrivers.toLocaleString()}
          trend={{ value: 'Live count', positive: true }}
        />
        <KPICard
          label="Completed Trips Today"
          value={data.kpis.completedToday.toLocaleString()}
        />
        <KPICard
          label="Avg Earnings / Driver"
          value={formatTZS(data.kpis.avgEarningsPerDriver)}
          sub="Today"
        />
        <KPICard
          label="Subscription Conversion"
          value={`${data.kpis.subscriptionConversionRate}%`}
          sub={`${data.kpis.activeSubscriptions} active subscriptions`}
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Earning Trend — Last 7 Days</h2>
          <EarningsTrendChart />
        </div>

        {/* Alerts */}
        <AlertsPanel
          pendingDrivers={data.alerts.pendingDrivers}
          expiredSubs={data.alerts.expiredSubs}
          openTickets={data.alerts.openTickets}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <RecentActivityFeed initialLogs={data.recentActivity} />
      </div>
    </div>
  )
}
