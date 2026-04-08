import { getSubscriptions, getPlans, getPayments } from '@/lib/queries/subscriptions'
import { createAdminClient } from '@/lib/supabase/server'
import { SubscriptionsView } from '@/components/subscriptions/SubscriptionsView'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsRow } from '@/components/ui/StatsRow'
import { formatTZS } from '@/lib/utils'
import type { StatItem } from '@/components/ui/StatsRow'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function settled(r: PromiseSettledResult<any>, fallback: any) {
  return r.status === 'fulfilled' ? r.value : fallback
}

const MOCK_STATS: StatItem[] = [
  { label: 'Active Subscriptions',  value: 842,         subBadge: '842 of 1,168', subText: 'drivers subscribed' },
  { label: 'Expired Subscriptions', value: 214,         subBadge: '214',          subText: 'need renewal' },
  { label: 'Failed Payments',       value: 31,          subBadge: '31',           subText: 'requires action' },
  { label: 'Monthly Revenue',       value: 'TZS 12.4M', subBadge: 'This month',   subText: 'subscription payments' },
]

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const params = await searchParams
  const tab  = params.tab ?? 'active'
  const page = Number(params.page ?? 1)

  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const supabase     = createAdminClient()

  const [subsResult, plans, paymentsResult, activeR, expiredR, failedR, revenueR] = await Promise.allSettled([
    tab !== 'plans' && tab !== 'payments'
      ? getSubscriptions({ status: tab === 'active' ? 'active' : tab === 'expired' ? 'expired' : undefined, page })
      : Promise.resolve({ subscriptions: [], total: 0 }),
    tab === 'plans' ? getPlans() : Promise.resolve([]),
    tab === 'payments' ? getPayments({ status: 'failed', page })
      : tab === 'payment_history' ? getPayments({ page })
      : Promise.resolve({ payments: [], total: 0 }),
    supabase.from('driver_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('driver_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
    supabase.from('subscription_payments').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase.from('subscription_payments').select('amount_tzs').eq('status', 'completed').gte('created_at', firstOfMonth),
  ])

  const activeSubs  = settled(activeR,   { count: 0 }).count ?? 0
  const expiredSubs = settled(expiredR,  { count: 0 }).count ?? 0
  const failedPays  = settled(failedR,   { count: 0 }).count ?? 0
  const revRows     = settled(revenueR,  { data: [] }).data ?? []
  const monthRevenue = (revRows as Record<string, number | null>[]).reduce((s, r) => s + (r.amount_tzs ?? 0), 0)

  const useMock = activeSubs === 0 && expiredSubs === 0
  const stats: StatItem[] = useMock ? MOCK_STATS : [
    { label: 'Active Subscriptions',  value: activeSubs,              subBadge: String(activeSubs),           subText: 'currently subscribed' },
    { label: 'Expired Subscriptions', value: expiredSubs,             subBadge: String(expiredSubs),          subText: 'need renewal' },
    { label: 'Failed Payments',       value: failedPays,              subBadge: String(failedPays),           subText: 'requires action' },
    { label: 'Monthly Revenue',       value: formatTZS(monthRevenue), subBadge: 'This month',                 subText: 'subscription payments' },
  ]

  const TABS = [
    { key: 'active',          label: 'Active' },
    { key: 'expired',         label: 'Expired' },
    { key: 'failed',          label: 'Failed Payments' },
    { key: 'plans',           label: 'Plans & Pricing' },
    { key: 'payment_history', label: 'Payment History' },
  ]

  return (
    <div className="space-y-4 w-full">
      <PageHeader title="Subscriptions" tabs={TABS} activeTab={tab} basePath="/subscriptions" />
      <StatsRow stats={stats} />
      <SubscriptionsView
        subscriptions={settled(subsResult, { subscriptions: [], total: 0 }).subscriptions}
        subsTotal={settled(subsResult, { subscriptions: [], total: 0 }).total}
        plans={settled(plans, []) as never[]}
        payments={settled(paymentsResult, { payments: [], total: 0 }).payments ?? []}
        paymentsTotal={settled(paymentsResult, { payments: [], total: 0 }).total ?? 0}
        tab={tab}
        page={page}
      />
    </div>
  )
}
