'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { AdminRole } from '@/lib/types'
import { ROLE_PERMISSIONS } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  label: string
  href: string
  module: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     href: '/dashboard',     module: 'dashboard',     icon: <IconGrid /> },
  { label: 'Drivers',       href: '/drivers',        module: 'drivers',       icon: <IconUser /> },
  { label: 'Rides',         href: '/rides',          module: 'rides',         icon: <IconCar /> },
  { label: 'Subscriptions', href: '/subscriptions',  module: 'subscriptions', icon: <IconCard /> },
  { label: 'Pricing',       href: '/pricing',        module: 'pricing',       icon: <IconTag /> },
  { label: 'Support',       href: '/support',        module: 'support',       icon: <IconHeadset /> },
  { label: 'Reports',       href: '/reports',        module: 'reports',       icon: <IconChart /> },
  { label: 'Settings',      href: '/settings',       module: 'settings',      icon: <IconGear /> },
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
      {/* Nav items */}
      <nav className="flex-1 flex flex-col items-center gap-1 w-full px-3 mt-2">
        {visibleItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`w-full flex items-center justify-center p-3 rounded-xl transition-colors ${
                active
                  ? 'bg-[#2B39C7] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="w-5 h-5">{item.icon}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-1 w-full px-3">
        <a
          href="mailto:support@pandahailing.com"
          title="Help"
          className="w-full flex items-center justify-center p-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <span className="w-5 h-5"><IconHelp /></span>
        </a>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="w-full flex items-center justify-center p-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors"
        >
          <span className="w-5 h-5"><IconLogout /></span>
        </button>
      </div>
    </aside>
  )
}

function IconGrid() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="2" width="7" height="7" rx="1.5"/>
      <rect x="11" y="2" width="7" height="7" rx="1.5"/>
      <rect x="2" y="11" width="7" height="7" rx="1.5"/>
      <rect x="11" y="11" width="7" height="7" rx="1.5"/>
    </svg>
  )
}
function IconUser() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <circle cx="10" cy="6" r="4"/>
      <path d="M2 18c0-4.418 3.582-8 8-8s8 3.582 8 8H2z"/>
    </svg>
  )
}
function IconCar() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 8.5L6 4h8l2 4.5H4zM2 11h16v5H2v-5zm3 2.5a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm8 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z"/>
    </svg>
  )
}
function IconCard() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <rect x="1" y="4" width="18" height="12" rx="2"/>
      <rect x="1" y="8" width="18" height="3" fill="white" opacity=".25"/>
    </svg>
  )
}
function IconTag() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 3h7l7 7-7 7-7-7V3zm5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/>
    </svg>
  )
}
function IconHeadset() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2a7 7 0 00-7 7v1H2v4h2.5a1 1 0 001-1v-3A6 6 0 0116 9v3a1 1 0 001 1H19V9h-1a7 7 0 00-7-7z" opacity=".8"/>
      <rect x="2" y="10" width="2.5" height="5" rx="1"/>
      <rect x="15.5" y="10" width="2.5" height="5" rx="1"/>
    </svg>
  )
}
function IconChart() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="10" width="4" height="8" rx="1"/>
      <rect x="8" y="6" width="4" height="12" rx="1"/>
      <rect x="14" y="2" width="4" height="16" rx="1"/>
    </svg>
  )
}
function IconGear() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
    </svg>
  )
}
function IconHelp() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 10a3 3 0 01-2 2.83V13a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
    </svg>
  )
}
function IconLogout() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h7a1 1 0 000-2H4V5h6a1 1 0 000-2H3zm11.293 4.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L15.586 11H9a1 1 0 110-2h6.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd"/>
    </svg>
  )
}
