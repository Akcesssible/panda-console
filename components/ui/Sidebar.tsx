'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { AdminRole } from '@/lib/types'
import { ROLE_PERMISSIONS } from '@/lib/types'

interface NavItem {
  label: string
  href: string
  module: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', module: 'dashboard', icon: <IconGrid /> },
  { label: 'Drivers', href: '/drivers', module: 'drivers', icon: <IconUser /> },
  { label: 'Rides', href: '/rides', module: 'rides', icon: <IconCar /> },
  { label: 'Subscriptions', href: '/subscriptions', module: 'subscriptions', icon: <IconCard /> },
  { label: 'Pricing', href: '/pricing', module: 'pricing', icon: <IconTag /> },
  { label: 'Support', href: '/support', module: 'support', icon: <IconHeadset /> },
  { label: 'Reports', href: '/reports', module: 'reports', icon: <IconChart /> },
  { label: 'Settings', href: '/settings', module: 'settings', icon: <IconGear /> },
]

export default function Sidebar({ role }: { role: AdminRole }) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter(item => {
    const perm = ROLE_PERMISSIONS[role]?.[item.module]
    return perm && perm !== 'none'
  })

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-gray-200">
        <span className="text-xl font-bold text-gray-900">panda</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-primary-50$ text-primary$ font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className={`w-4 h-4 ${active ? 'text-primary$' : 'text-gray-400'}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

// Simple inline SVG icons
function IconGrid() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
      <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>
  )
}
function IconUser() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="5" r="3"/><path d="M1 14c0-3.314 3.134-6 7-6s7 2.686 7 6H1z"/>
    </svg>
  )
}
function IconCar() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 7l1.5-3.5h7L13 7H3zm-2 2h14v4H1V9zm2 2a1 1 0 102 0 1 1 0 00-2 0zm8 0a1 1 0 102 0 1 1 0 00-2 0z"/>
    </svg>
  )
}
function IconCard() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="3" width="14" height="10" rx="2"/><rect x="1" y="6" width="14" height="2" fill="white" opacity=".4"/>
    </svg>
  )
}
function IconTag() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 2h6l6 6-6 6-6-6V2zm4 2a1 1 0 100 2 1 1 0 000-2z"/>
    </svg>
  )
}
function IconHeadset() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a6 6 0 00-6 6v1H1v3h2a1 1 0 001-1V8a5 5 0 0110 0v2a1 1 0 001 1h2V8h-1V7a6 6 0 00-6-6z"/>
    </svg>
  )
}
function IconChart() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="8" width="3" height="6"/><rect x="6" y="4" width="3" height="10"/>
      <rect x="11" y="1" width="3" height="13"/>
    </svg>
  )
}
function IconGear() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 10a2 2 0 100-4 2 2 0 000 4zm5.657-2a5.97 5.97 0 01-.172 1.414l1.54 1.197-1 1.732-1.772-.8A5.97 5.97 0 0110 12.9V15H6v-2.1a5.97 5.97 0 01-2.253-.957l-1.772.8-1-1.732 1.54-1.197A5.97 5.97 0 012 8c0-.486.064-.958.172-1.414L.632 5.389l1-1.732 1.772.8A5.97 5.97 0 016 3.1V1h4v2.1a5.97 5.97 0 012.253.957l1.772-.8 1 1.732-1.54 1.197A5.97 5.97 0 0113.657 8z"/>
    </svg>
  )
}
