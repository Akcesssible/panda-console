'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DashboardSquare01Icon,
  UserCircleIcon,
  Car01Icon,
  CreditCardPosIcon,
  Tag01Icon,
  HeadphonesIcon,
  BarChartIcon,
  Settings01Icon,
  HelpCircleIcon,
  Logout01Icon,
} from '@hugeicons/core-free-icons'
import type { AdminRole } from '@/lib/types'
import { ROLE_PERMISSIONS } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  label: string
  href: string
  module: string
  icon: typeof DashboardSquare01Icon
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     href: '/dashboard',    module: 'dashboard',     icon: DashboardSquare01Icon },
  { label: 'Drivers',       href: '/drivers',       module: 'drivers',       icon: UserCircleIcon },
  { label: 'Rides',         href: '/rides',         module: 'rides',         icon: Car01Icon },
  { label: 'Subscriptions', href: '/subscriptions', module: 'subscriptions', icon: CreditCardPosIcon },
  { label: 'Pricing',       href: '/pricing',       module: 'pricing',       icon: Tag01Icon },
  { label: 'Support',       href: '/support',       module: 'support',       icon: HeadphonesIcon },
  { label: 'Reports',       href: '/reports',       module: 'reports',       icon: BarChartIcon },
  { label: 'Settings',      href: '/settings',      module: 'settings',      icon: Settings01Icon },
]

export default function Sidebar({ role }: { role: AdminRole }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const visibleItems = NAV_ITEMS.filter(item => {
    const perm = ROLE_PERMISSIONS[role]?.[item.module]
    return perm && perm !== 'none'
  })

  return (
    <aside className="w-[72px] bg-[#1d242d] flex flex-col items-center py-4 shrink-0">
      <nav className="flex-1 flex flex-col items-center gap-1 w-full px-3 mt-2">
        {visibleItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`w-full flex items-center justify-center p-3 rounded-xl transition-colors ${
                active ? 'bg-[#2B39C7] text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <HugeiconsIcon icon={item.icon} size={20} color="currentColor" strokeWidth={1.8} />
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col items-center gap-1 w-full px-3">
        <a
          href="mailto:support@pandahailing.com"
          title="Help"
          className="w-full flex items-center justify-center p-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <HugeiconsIcon icon={HelpCircleIcon} size={20} color="currentColor" strokeWidth={1.8} />
        </a>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="w-full flex items-center justify-center p-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors"
        >
          <HugeiconsIcon icon={Logout01Icon} size={20} color="currentColor" strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  )
}
