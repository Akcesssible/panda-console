import { getAdminUser } from '@/lib/auth'
import Sidebar from '@/components/ui/Sidebar'
import TopBar from '@/components/ui/TopBar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await getAdminUser()

  return (
    <div className="flex flex-col h-screen bg-[#F0F2F5] overflow-hidden">
      <TopBar adminUser={adminUser} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={adminUser.role} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
