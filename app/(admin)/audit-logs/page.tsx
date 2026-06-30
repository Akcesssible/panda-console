import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { AuditLogsView } from '@/components/audit-logs/AuditLogsView'

export default async function AuditLogsPage() {
  const adminUser = await getAdminUser()

  if (!canAccess(adminUser.role, 'audit_logs')) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-4 w-full">
      <PageHeader
        title="Audit Logs"
        subtitle="Complete record of all admin actions across the platform"
      />
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <AuditLogsView initialLogs={[]} initialTotal={0} />
      </div>
    </div>
  )
}
