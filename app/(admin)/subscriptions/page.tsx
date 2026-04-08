import { getSubscriptions, getPlans, getPayments } from '@/lib/queries/subscriptions'
import { SubscriptionsView } from '@/components/subscriptions/SubscriptionsView'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const params = await searchParams
  const tab = params.tab ?? 'active'
  const page = Number(params.page ?? 1)

  const [subsResult, plans, paymentsResult] = await Promise.all([
    tab !== 'plans' && tab !== 'payments'
      ? getSubscriptions({ status: tab === 'active' ? 'active' : tab === 'expired' ? 'expired' : undefined, page })
      : Promise.resolve({ subscriptions: [], total: 0 }),
    tab === 'plans' ? getPlans() : Promise.resolve([]),
    tab === 'payments' ? getPayments({ status: 'failed', page })
      : tab === 'payment_history' ? getPayments({ page })
      : Promise.resolve({ payments: [], total: 0 }),
  ])

  const TABS = [
    { key: 'active', label: 'Active' },
    { key: 'expired', label: 'Expired' },
    { key: 'failed', label: 'Failed Payments' },
    { key: 'plans', label: 'Plans & Pricing' },
    { key: 'payment_history', label: 'Payment History' },
  ]

  return (
    <div className="space-y-4 max-w-7xl">
      <PageHeader
        title="Subscriptions"
        subtitle="Manage driver subscription plans and payments"
        tabs={TABS}
        activeTab={tab}
        basePath="/subscriptions"
      />
      <SubscriptionsView
        subscriptions={subsResult.subscriptions}
        subsTotal={subsResult.total}
        plans={plans}
        payments={paymentsResult.payments ?? []}
        paymentsTotal={paymentsResult.total ?? 0}
        tab={tab}
        page={page}
      />
    </div>
  )
}
