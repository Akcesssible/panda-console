import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SettingsView } from '@/components/settings/SettingsView'
import { PageHeader } from '@/components/ui/PageHeader'

async function getSettingsData() {
  const supabase = createAdminClient()
  const [{ data: admins }, { data: zones }, { data: config }, { data: logs }, { data: customRoles }] = await Promise.all([
    supabase.from('admin_users').select('*').order('created_at'),
    supabase.from('zones').select('*').order('name'),
    supabase.from('system_config').select('*'),
    supabase.from('audit_logs')
      .select('*, admin_users(full_name)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('custom_roles').select('*').order('created_at'),
  ])
  return {
    admins: admins ?? [],
    zones: zones ?? [],
    config: config ?? [],
    logs: logs ?? [],
    customRoles: customRoles ?? [],
  }
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams
  const tab = params.tab ?? 'users'
  const adminUser = await getAdminUser()

  // Only super_admin can access settings
  if (adminUser.role !== 'super_admin') redirect('/dashboard')

  const data = await getSettingsData()

  const TABS = [
    { key: 'users',  label: 'Users' },
    { key: 'roles',  label: 'Roles' },
    { key: 'zones',  label: 'Cities & Zones' },
    { key: 'config', label: 'System Config' },
    { key: 'logs',   label: 'System Logs' },
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
