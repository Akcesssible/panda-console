import { getAdminUser } from '@/lib/auth'
import { PricingView } from '@/components/pricing/PricingView'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams
  const tab = params.tab ?? 'active'
  const adminUser = await getAdminUser()

  const TABS = [
    { key: 'active',   label: 'Active Rules' },
    { key: 'history',  label: 'Pricing History' },
  ]

  return (
    <div className="space-y-4 w-full">
      <PageHeader title="Pricing" tabs={TABS} activeTab={tab} basePath="/pricing" />
      <PricingView activeRules={[]} historyRules={[]} zones={[]} tab={tab} adminRole={adminUser.role} />
    </div>
  )
}
