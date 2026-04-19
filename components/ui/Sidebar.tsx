'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Home01Icon,
  SteeringIcon,
  BaseballHelmetIcon,
  Ticket02Icon,
  TradeUpIcon,
  HelpCircleIcon,
  Logout02Icon,
  CustomerService02Icon,
  ChartBarLineIcon,
  Configuration02Icon,
  UserMultiple02Icon,
  Coins01Icon,
  Audit01Icon,
} from '@hugeicons-pro/core-stroke-rounded'
import type { AdminRole } from '@/lib/types'
import { ROLE_PERMISSIONS } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  label: string
  href: string
  module: string
  icon: typeof Home01Icon
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     href: '/dashboard',    module: 'dashboard',     icon: Home01Icon },
  { label: 'Drivers',       href: '/drivers',       module: 'drivers',       icon: SteeringIcon },
  { label: 'Riders',        href: '/riders',        module: 'riders',        icon: UserMultiple02Icon },
  { label: 'Rides',         href: '/rides',         module: 'rides',         icon: BaseballHelmetIcon },
  { label: 'Subscriptions', href: '/subscriptions', module: 'subscriptions', icon: Ticket02Icon },
  { label: 'Commissions',  href: '/commissions',   module: 'commissions',   icon: Coins01Icon },
  { label: 'Pricing',      href: '/pricing',        module: 'pricing',       icon: TradeUpIcon },
  { label: 'Support',       href: '/support',       module: 'support',       icon: CustomerService02Icon },
  { label: 'Reports',     href: '/reports',     module: 'reports',     icon: ChartBarLineIcon },
  { label: 'Audit Logs', href: '/audit-logs', module: 'audit_logs',  icon: Audit01Icon },
  { label: 'Settings',   href: '/settings',   module: 'settings',    icon: Configuration02Icon },
]

export default function Sidebar({ role }: { role: AdminRole }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    // Record logout + transition status to 'logged_out' BEFORE invalidating
    // the session — must be awaited so the cookie is still valid when the
    // request hits the server.
    await fetch('/api/auth/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'logout' }),
    }).catch(() => {})

    const supabase = createClient()
    await supabase.auth.signOut()
    // Hard navigation + history replace — the login page overwrites the current
    // history entry so the back button cannot return to any protected page.
    window.location.replace('/login')
  }

  const visibleItems = NAV_ITEMS.filter(item => {
    const perm = ROLE_PERMISSIONS[role]?.[item.module]
    return perm && perm !== 'none'
  })

  return (
    <aside className="flex w-[92px] px-4 py-6 flex-col justify-between items-start">
      <nav className="bg-white rounded-full flex flex-col items-center py-2.5 gap-0.5 w-[60px]">
        {visibleItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors ${
                active
                  ? 'bg-[#1a2547] text-white'
                  : 'text-[#1a2547] hover:bg-gray-100'
              }`}
            >
              <HugeiconsIcon icon={item.icon} size={20} color="currentColor" strokeWidth={1.8} />
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col items-center gap-1.5">
        {/* Version badge */}
        <span
          title="Panda Console v0.7.0"
          className="text-[9px] font-mono text-gray-400 tracking-wide select-none"
        >
          v0.7.0
        </span>

        <div className="bg-white rounded-full flex flex-col items-center py-2.5 gap-0.5 w-[60px]">
          <a
            href="mailto:support@pandahailing.com"
            title="Help"
            className="w-11 h-11 flex items-center justify-center rounded-full text-[#1a2547] hover:bg-gray-100 transition-colors">
            <HugeiconsIcon icon={HelpCircleIcon} size={20} color="currentColor" strokeWidth={1.8} />
          </a>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <HugeiconsIcon icon={Logout02Icon} size={20} color="#e02020" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </aside>
  )
}
