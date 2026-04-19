import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { EarningTrendCard } from '@/components/dashboard/EarningTrendCard'
import { ActiveDriversCluster } from '@/components/dashboard/ActiveDriversCluster'
import { ChurnRateCard } from '@/components/dashboard/ChurnRateCard'
import { ActionAlertCard } from '@/components/dashboard/ActionAlertCard'
import { RecentActivityTable } from '@/components/dashboard/RecentActivityTable'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpRight01Icon } from '@hugeicons-pro/core-stroke-rounded'
import { settled } from '@/lib/utils'
import type { AuditLog } from '@/lib/types'

/** Index into Mon–Sun array (0 = Mon, 6 = Sun) from a JS Date */
function dayIndex(date: Date): number {
  const dow = date.getDay() // 0 = Sun
  return dow === 0 ? 6 : dow - 1
}

async function getDashboardData() {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Monday of current week
  const now = new Date()
  const mondayOffset = now.getDay() === 0 ? -6 : 1 - now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + mondayOffset)
  weekStart.setHours(0, 0, 0, 0)

  // Monday of previous week
  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)

  // First day of 6 months ago (for churn window)
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const results = await Promise.allSettled([
    /* 0 */ supabase.from('drivers').select('*', { count: 'exact', head: true }),
    /* 1 */ supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    /* 2 */ supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    /* 3 */ supabase.from('rides').select('*', { count: 'exact', head: true })
              .eq('status', 'completed').gte('completed_at', today),
    /* 4 */ supabase.from('rides').select('driver_earnings_tzs')
              .eq('status', 'completed').gte('completed_at', today),
    /* 5 */ supabase.from('driver_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    /* 6 */ supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
    /* 7 */ supabase.from('driver_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
    /* 8 */ supabase.from('rides').select('commission_tzs, completed_at')
              .eq('status', 'completed').gte('completed_at', weekStart.toISOString()),
    /* 9 */ supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20),
    /* 10 */ supabase.from('subscription_payments').select('amount_tzs, paid_at')
               .eq('status', 'completed').gte('paid_at', weekStart.toISOString()),
    /* 11 */ supabase.from('rides').select('commission_tzs')
               .eq('status', 'completed')
               .gte('completed_at', prevWeekStart.toISOString())
               .lt('completed_at', weekStart.toISOString()),
    /* 12 */ supabase.from('subscription_payments').select('amount_tzs')
               .eq('status', 'completed')
               .gte('paid_at', prevWeekStart.toISOString())
               .lt('paid_at', weekStart.toISOString()),
    /* 13 */ supabase.from('drivers').select('updated_at')
               .eq('status', 'churned').gte('updated_at', sixMonthsAgo.toISOString()),
    /* 14 */ supabase.from('drivers').select('*', { count: 'exact', head: true }).neq('status', 'pending'),
  ])

  const totalDrivers        = settled(results[0],  { count: 0 }).count ?? 0
  const activeDrivers       = settled(results[1],  { count: 0 }).count ?? 0
  const pendingDrivers      = settled(results[2],  { count: 0 }).count ?? 0
  const completedToday      = settled(results[3],  { count: 0 }).count ?? 0
  const todayEarnings       = settled(results[4],  { data: [] }).data ?? []
  const activeSubscriptions = settled(results[5],  { count: 0 }).count ?? 0
  const expiredSubs         = settled(results[7],  { count: 0 }).count ?? 0
  const thisWeekRides       = settled(results[8],  { data: [] }).data ?? []
  const recentActivity      = settled(results[9],  { data: [] }).data ?? []
  const thisWeekSubs        = settled(results[10], { data: [] }).data ?? []
  const prevWeekRides       = settled(results[11], { data: [] }).data ?? []
  const prevWeekSubs        = settled(results[12], { data: [] }).data ?? []
  const churnedDrivers      = settled(results[13], { data: [] }).data ?? []
  const nonPendingDrivers   = settled(results[14], { count: 0 }).count ?? 0

  // ── Earning trend arrays (index 0 = Mon … 6 = Sun) ──────────────────────────
  const commissionTrend  = Array<number>(7).fill(0)
  const subscriptionTrend = Array<number>(7).fill(0)

  for (const r of thisWeekRides as { commission_tzs: number | null; completed_at: string }[]) {
    commissionTrend[dayIndex(new Date(r.completed_at))] += r.commission_tzs ?? 0
  }
  for (const p of thisWeekSubs as { amount_tzs: number | null; paid_at: string }[]) {
    subscriptionTrend[dayIndex(new Date(p.paid_at))] += p.amount_tzs ?? 0
  }

  // ── Week-over-week % change ──────────────────────────────────────────────────
  const thisCommTotal = commissionTrend.reduce((a, b) => a + b, 0)
  const thisSubTotal  = subscriptionTrend.reduce((a, b) => a + b, 0)
  const prevCommTotal = (prevWeekRides as { commission_tzs: number | null }[])
    .reduce((s, r) => s + (r.commission_tzs ?? 0), 0)
  const prevSubTotal  = (prevWeekSubs as { amount_tzs: number | null }[])
    .reduce((s, r) => s + (r.amount_tzs ?? 0), 0)

  const commissionChange   = prevCommTotal > 0
    ? Math.round(((thisCommTotal - prevCommTotal) / prevCommTotal) * 1000) / 10 : null
  const subscriptionChange = prevSubTotal > 0
    ? Math.round(((thisSubTotal - prevSubTotal) / prevSubTotal) * 1000) / 10 : null

  // ── Monthly churn rate (last 6 months) ──────────────────────────────────────
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const churnByMonth: Record<string, number> = {}
  for (const d of churnedDrivers as { updated_at: string }[]) {
    const date = new Date(d.updated_at)
    const key  = `${date.getFullYear()}-${date.getMonth()}`
    churnByMonth[key] = (churnByMonth[key] ?? 0) + 1
  }
  const churnData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now)
    d.setMonth(d.getMonth() - (5 - i))
    const key     = `${d.getFullYear()}-${d.getMonth()}`
    const churned = churnByMonth[key] ?? 0
    const rate    = nonPendingDrivers > 0
      ? Math.round((churned / nonPendingDrivers) * 1000) / 10 : 0
    return { month: MONTHS[d.getMonth()], rate }
  })

  // ── Misc ─────────────────────────────────────────────────────────────────────
  const totalEarningsToday = (todayEarnings as Record<string, number | null>[])
    .reduce((sum, r) => sum + (r.driver_earnings_tzs ?? 0), 0)
  const avgEarningsPerDriver = activeDrivers > 0 ? totalEarningsToday / activeDrivers : 0
  const subscriptionConversionRate = activeDrivers > 0
    ? Math.round((activeSubscriptions / activeDrivers) * 100) : 0

  return {
    totalDrivers, activeDrivers, pendingDrivers, completedToday,
    avgEarningsPerDriver, subscriptionConversionRate, activeSubscriptions,
    expiredSubs, recentActivity,
    commissionTrend, subscriptionTrend, commissionChange, subscriptionChange,
    churnData,
  }
}

export default async function DashboardPage() {
  const [adminUser, data] = await Promise.all([getAdminUser(), getDashboardData()])
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-3 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-medium text-[#1d242d] tracking-[-1px]">
            {greeting}, {adminUser.full_name.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Real-time operational snapshot</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/rides"
            className="flex items-center gap-4 text-base font-medium text-[#1d242d] bg-white rounded-full p-4 hover:bg-gray-50 transition-colors"
          >
            Live Rides
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} color="#1d242d" strokeWidth={1.5} />
          </Link>
          <Link
            href="/subscriptions?tab=expired"
            className="flex items-center gap-4 text-base font-medium text-[#1d242d] bg-white rounded-full p-4 hover:bg-gray-50 transition-colors"
          >
            Expired Subscriptions
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} color="#1d242d" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* Top row — 3 equal columns */}
      <div className="grid grid-cols-3 gap-3">
        <EarningTrendCard
          commissionTrend={data.commissionTrend}
          subscriptionTrend={data.subscriptionTrend}
          commissionChange={data.commissionChange}
          subscriptionChange={data.subscriptionChange}
        />
        <ActiveDriversCluster
          activeDrivers={data.activeDrivers}
          completedToday={data.completedToday}
          avgEarningsPerDriver={data.avgEarningsPerDriver}
          subscriptionConversionRate={data.subscriptionConversionRate}
          activeSubscriptions={data.activeSubscriptions}
          totalDrivers={data.totalDrivers}
        />
        <ChurnRateCard churnData={data.churnData} />
      </div>

      {/* Bottom row — left narrow (alerts) + right wide (activity) */}
      <div className="grid grid-cols-3 gap-3">
        {/* Left column — stacked alert cards */}
        <div className="flex flex-col gap-3">
          <ActionAlertCard
            title="Drivers Pending Approval"
            count={data.pendingDrivers}
            unit="Drivers"
            description="New drivers awaiting verification"
            ctaLabel="Verify Driver"
            ctaHref="/drivers?tab=pending"
          />
          <ActionAlertCard
            title="Expired Subscriptions"
            count={data.expiredSubs}
            unit="Subs"
            description="Subscriptions need renewal"
            ctaLabel="Notify Drivers"
            ctaHref="/subscriptions?tab=expired"
          />
        </div>

        {/* Right column — recent activity */}
        <div className="col-span-2">
          <RecentActivityTable initialLogs={data.recentActivity as AuditLog[]} />
        </div>
      </div>
    </div>
  )
}
