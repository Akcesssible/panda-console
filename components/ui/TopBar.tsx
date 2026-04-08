'use client'

import Image from 'next/image'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search02Icon, Notification01Icon, InformationCircleIcon, ArrowDown01Icon } from '@hugeicons/core-free-icons'
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
    <header className="h-18 flex items-center justify-between px-6 shrink-0 z-10">
      {/* Logo */}
      <Link href="/dashboard">
        <Image src="/panda-logo.svg" alt="Panda Console" width={110} height={36} priority />
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <div className='flex items-center gap-4 p-2 bg-white rounded-full'>
          <button className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-[#DADFE5] transition-colors">
            <HugeiconsIcon icon={Search02Icon} size={24} color="#1E1E1E" strokeWidth={1.5} />
          </button> 

          <button className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-[#DADFE5] transition-colors relative">
            <HugeiconsIcon icon={Notification01Icon} size={24} color="#1E1E1E" strokeWidth={1.5} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2B39C7] rounded-full" />
          </button>

          <button className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-[#DADFE5] transition-colors">
            <HugeiconsIcon icon={InformationCircleIcon} size={24} color="#1E1E1E" strokeWidth={1.5} />
          </button>
        </div>
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* User pill */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-[#e8eaf6] flex items-center justify-center text-sm font-semibold text-[#2B39C7]">
              {getInitials(adminUser.full_name)}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-[#1d242d] leading-tight">{adminUser.full_name}</p>
            <p className="text-xs text-gray-400 leading-tight">{ROLE_LABELS[adminUser.role] ?? adminUser.role}</p>
          </div>
          <HugeiconsIcon icon={ArrowDown01Icon} size={16} color="#9ca3af" strokeWidth={1.8} className="hidden sm:block" />
        </div>
      </div>
    </header>
  )
}
