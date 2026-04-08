import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpRight01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'

interface Props {
  title: string
  count: number
  description: string
  badge?: string
  ctaLabel: string
  ctaHref: string
}

export function ActionAlertCard({ title, count, description, badge, ctaLabel, ctaHref }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-[#1d242d]">{title}</span>
        <HugeiconsIcon icon={InformationCircleIcon} size={14} color="#d1d5db" strokeWidth={1.5} />
      </div>

      <div>
        <p className="text-4xl font-bold text-[#1d242d]">{count.toLocaleString()}</p>
        <p className="text-sm text-gray-400 mt-0.5">{description}</p>
        {badge && (
          <span className="inline-flex mt-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>

      <Link
        href={ctaHref}
        className="flex items-center justify-between bg-[#1d242d] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#2a3340] transition-colors"
      >
        {ctaLabel}
        <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} color="currentColor" strokeWidth={1.8} className="opacity-60" />
      </Link>
    </div>
  )
}
