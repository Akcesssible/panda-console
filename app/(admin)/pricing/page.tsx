import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { PricingView } from '@/components/pricing/PricingView'
import { PageHeader } from '@/components/ui/PageHeader'
import type { PricingRule } from '@/lib/types'

async function getPricingData() {
  const supabase = createAdminClient()
  const [{ data: rules }, { data: zones }] = await Promise.all([
    supabase.from('pricing_rules').select('*, zones(id, name)').order('priority', { ascending: false }),
    supabase.from('zones').select('id, name').eq('is_active', true),
  ])
  return { rules: (rules ?? []) as PricingRule[], zones: zones ?? [] }
}

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams
  const tab = params.tab ?? 'active'
  const [adminUser, { rules, zones }] = await Promise.all([getAdminUser(), getPricingData()])

  const active = rules.filter(r => r.is_active)
  const history = rules.filter(r => !r.is_active)

  const TABS = [
    { key: 'active', label: 'Active Rules' },
    { key: 'history', label: 'Pricing History' },
  ]

  return (
    <div className="space-y-4 max-w-5xl">
      <PageHeader
        title="Pricing"
        subtitle="Manage fare rules and pricing configuration"
        tabs={TABS}
        activeTab={tab}
        basePath="/pricing"
      />
      <PricingView
        activeRules={active}
        historyRules={history}
        zones={zones}
        tab={tab}
        adminRole={adminUser.role}
      />
    </div>
  )
}
