import { getAdminUser } from '@/lib/auth'
import Sidebar from '@/components/ui/Sidebar'
import TopBar from '@/components/ui/TopBar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await getAdminUser()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar role={adminUser.role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar adminUser={adminUser} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
