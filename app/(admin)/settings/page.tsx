import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SettingsView } from '@/components/settings/SettingsView'

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

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">System configuration — Super Admin only</p>
      </div>
      <SettingsView tab={tab} {...data} currentAdmin={adminUser} />
    </div>
  )
}
