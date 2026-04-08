import { getSubscriptions, getPlans, getPayments } from '@/lib/queries/subscriptions'
import { SubscriptionsView } from '@/components/subscriptions/SubscriptionsView'

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

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage driver subscription plans and payments</p>
      </div>
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
