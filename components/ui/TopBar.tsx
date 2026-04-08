'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { AdminUser } from '@/lib/types'

const ROLE_LABELS: Record<string, string> = {
  super_admin:    'Chief Admin',
  ops_admin:      'Operations Admin',
  support_agent:  'Support Agent',
  finance_viewer: 'Finance Viewer',
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function TopBar({ adminUser }: { adminUser: AdminUser }) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
      {/* Logo */}
      <Link href="/dashboard">
        <Image src="/panda-logo.svg" alt="Panda Console" width={110} height={36} priority />
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
          </svg>
        </button>

        {/* Notifications */}
        <button className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors relative">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z"/>
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2B39C7] rounded-full" />
        </button>

        {/* Info */}
        <button className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* User pill */}
        <div className="flex items-center gap-3 pl-1">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
              {getInitials(adminUser.full_name)}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-[#1d242d] leading-tight">{adminUser.full_name}</p>
            <p className="text-xs text-gray-400 leading-tight">{ROLE_LABELS[adminUser.role] ?? adminUser.role}</p>
          </div>
          <svg className="w-4 h-4 text-gray-400 hidden sm:block" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </div>
      </div>
    </header>
  )
}
