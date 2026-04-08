import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { PricingView } from '@/components/pricing/PricingView'
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

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Pricing</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage fare rules and pricing configuration</p>
      </div>
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
