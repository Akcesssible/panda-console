'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AdminUser } from '@/lib/types'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  ops_admin: 'Operations Admin',
  support_agent: 'Support Agent',
  finance_viewer: 'Finance Viewer',
}

export default function TopBar({ adminUser }: { adminUser: AdminUser }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div /> {/* spacer — page title comes from each page */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{adminUser.full_name}</p>
          <p className="text-xs text-gray-500">{ROLE_LABELS[adminUser.role]}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
