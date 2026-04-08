import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SettingsView } from '@/components/settings/SettingsView'
import { PageHeader } from '@/components/ui/PageHeader'

async function getSettingsData() {
  const supabase = createAdminClient()
  const [{ data: admins }, { data: zones }, { data: config }, { data: logs }] = await Promise.all([
    supabase.from('admin_users').select('*').order('created_at'),
    supabase.from('zones').select('*').order('name'),
    supabase.from('system_config').select('*'),
    supabase.from('audit_logs')
      .select('*, admin_users(full_name)')
      .order('created_at', { ascending: false })
      .limit(50),
  ])
  return { admins: admins ?? [], zones: zones ?? [], config: config ?? [], logs: logs ?? [] }
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams
  const tab = params.tab ?? 'admin_users'
  const adminUser = await getAdminUser()

  // Only super_admin can access settings
  if (adminUser.role !== 'super_admin') redirect('/dashboard')

  const data = await getSettingsData()

  const TABS = [
    { key: 'admin_users', label: 'Admin Users' },
    { key: 'zones', label: 'Cities & Zones' },
    { key: 'config', label: 'System Config' },
    { key: 'logs', label: 'System Logs' },
  ]

  return (
    <div className="space-y-4 w-full">
      <PageHeader
        title="Settings"
        subtitle="System configuration — Super Admin only"
        tabs={TABS}
        activeTab={tab}
        basePath="/settings"
      />
      <SettingsView tab={tab} {...data} currentAdmin={adminUser} />
    </div>
  )
}
