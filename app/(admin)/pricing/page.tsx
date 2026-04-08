import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { PricingView } from '@/components/pricing/PricingView'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsRow } from '@/components/ui/StatsRow'
import type { PricingRule } from '@/lib/types'
import type { StatItem } from '@/components/ui/StatsRow'

const MOCK_STATS: StatItem[] = [
  { label: 'Active Rules',    value: 3,  subBadge: '3 rules',   subText: 'live fare rules' },
  { label: 'Vehicle Types',   value: 3,  subBadge: '3 types',   subText: 'Bodaboda · Bajaj · Car' },
  { label: 'Active Zones',    value: 5,  subBadge: '5 cities',  subText: 'zones covered' },
  { label: 'Pricing History', value: 12, subBadge: '12',        subText: 'deactivated rules' },
]

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
  const tab    = params.tab ?? 'active'
  const [adminUser, { rules, zones }] = await Promise.all([getAdminUser(), getPricingData()])

  const active  = rules.filter(r => r.is_active)
  const history = rules.filter(r => !r.is_active)

  const useMock = rules.length === 0
  const vehicleTypes = useMock ? 3 : [...new Set(active.map(r => r.vehicle_type).filter(Boolean))].length
  const stats: StatItem[] = useMock ? MOCK_STATS : [
    { label: 'Active Rules',    value: active.length,  subBadge: String(active.length),   subText: 'live fare rules' },
    { label: 'Vehicle Types',   value: vehicleTypes,   subBadge: String(vehicleTypes),    subText: 'types covered' },
    { label: 'Active Zones',    value: zones.length,   subBadge: String(zones.length),    subText: 'cities covered' },
    { label: 'Pricing History', value: history.length, subBadge: String(history.length),  subText: 'deactivated rules' },
  ]

  const TABS = [
    { key: 'active',  label: 'Active Rules' },
    { key: 'history', label: 'Pricing History' },
  ]

  return (
    <div className="space-y-4 w-full">
      <PageHeader title="Pricing" tabs={TABS} activeTab={tab} basePath="/pricing" />
      <StatsRow stats={stats} />
      <PricingView activeRules={active} historyRules={history} zones={zones} tab={tab} adminRole={adminUser.role} />
    </div>
  )
}
