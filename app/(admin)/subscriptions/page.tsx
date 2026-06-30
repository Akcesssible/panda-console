import { getSubscriptions, getPlans, getPayments } from '@/lib/queries/subscriptions'
import { SubscriptionsView } from '@/components/subscriptions/SubscriptionsView'
import { PageHeader } from '@/components/ui/PageHeader'

const TABS = [
  { key: 'active',          label: 'Active' },
  { key: 'expired',         label: 'Expired' },
  { key: 'failed',          label: 'Failed Payments' },
  { key: 'plans',           label: 'Plans & Pricing' },
  { key: 'payment_history', label: 'Payment History' },
]

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const params = await searchParams
  const tab  = params.tab ?? 'active'
  const page = Number(params.page ?? 1)

  const [subsResult, plansResult, paymentsResult] = await Promise.allSettled([
    tab !== 'plans' && tab !== 'payment_history' && tab !== 'failed'
      ? getSubscriptions({ status: tab === 'active' ? 'active' : tab === 'expired' ? 'expired' : undefined, page })
      : Promise.resolve({ subscriptions: [], total: 0 }),
    tab === 'plans' ? getPlans() : Promise.resolve([]),
    tab === 'payment_history'
      ? getPayments({ page })
      : tab === 'failed'
      ? getPayments({ status: 'failed', page })
      : Promise.resolve({ payments: [], total: 0 }),
  ])

  const { subscriptions, total: subsTotal } =
    subsResult.status === 'fulfilled' ? subsResult.value : { subscriptions: [], total: 0 }
  const plans =
    plansResult.status === 'fulfilled' ? plansResult.value : []
  const { payments, total: paymentsTotal } =
    paymentsResult.status === 'fulfilled' ? paymentsResult.value : { payments: [], total: 0 }

  return (
    <div className="space-y-4 w-full">
      <PageHeader title="Subscriptions" tabs={TABS} activeTab={tab} basePath="/subscriptions" />
      <SubscriptionsView
        subscriptions={subscriptions}
        subsTotal={subsTotal}
        plans={plans as never[]}
        payments={payments ?? []}
        paymentsTotal={paymentsTotal ?? 0}
        tab={tab}
        page={page}
      />
    </div>
  )
}
