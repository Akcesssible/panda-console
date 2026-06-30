import { getAdminUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SettingsView } from '@/components/settings/SettingsView'
import { PageHeader } from '@/components/ui/PageHeader'
import { api } from '@/lib/api/client'
import { paths } from '@/lib/api/paths'
import { toUiRole } from '@/lib/api/adapters'
import type { BackendAdminUser } from '@/lib/api/types'
import type { AdminUser } from '@/lib/types'

async function getAdmins(): Promise<AdminUser[]> {
  try {
    const users = await api.get<BackendAdminUser[]>(paths.adminUsers)
    return (users ?? []).map(u => ({
      id: u.id,
      auth_id: null,
      full_name: u.fullName,
      email: u.email,
      role: toUiRole(u.role),
      is_active: u.status === 'ACTIVE',
      created_at: u.createdAt,
      updated_at: u.createdAt,
    }))
  } catch {
    return []
  }
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams
  const tab = params.tab ?? 'users'
  const adminUser = await getAdminUser()

  if (adminUser.role !== 'super_admin') redirect('/dashboard')

  const admins = await getAdmins()

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
      <SettingsView
        tab={tab}
        admins={admins}
        zones={[]}
        config={[]}
        logs={[]}
        logsTotal={0}
        currentAdmin={adminUser}
        customRoles={[]}
      />
    </div>
  )
}
