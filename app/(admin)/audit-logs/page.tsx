import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { AuditLogsView } from '@/components/audit-logs/AuditLogsView'
import type { AuditLog } from '@/lib/types'

async function getInitialLogs() {
  const supabase = createAdminClient()
  const { data, count } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)
  return { logs: (data ?? []) as AuditLog[], total: count ?? 0 }
}

export default async function AuditLogsPage() {
  const adminUser = await getAdminUser()

  // Gate access via the permissions matrix — any role with audit_logs read+ can view
  if (!canAccess(adminUser.role, 'audit_logs')) {
    redirect('/dashboard')
  }

  const { logs, total } = await getInitialLogs()

  return (
    <div className="space-y-4 w-full">
      <PageHeader
        title="Audit Logs"
        subtitle="Complete record of all admin actions across the platform"
      />
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <AuditLogsView initialLogs={logs} initialTotal={total} />
      </div>
    </div>
  )
}
