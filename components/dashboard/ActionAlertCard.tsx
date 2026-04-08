import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpRight01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'

interface Props {
  title: string
  count: number
  unit: string
  description: string
  badge?: string
  ctaLabel: string
  ctaHref: string
}

export function ActionAlertCard({ title, count, unit, description, ctaLabel, ctaHref }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col justify-between flex-1 min-h-[200px]">

      {/* Top — title + info */}
      <div className="flex items-center gap-1.5">
        <span className="text-base font-medium text-[#1d242d] tracking-[-.5px]">{title}</span>
        <HugeiconsIcon icon={InformationCircleIcon} size={16} color="#9ca3af" strokeWidth={1.5} />
      </div>

      {/* Bottom — count+desc on left, CTA on right */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-medium text-[#1d242d] leading-none tracking-tight">
            {count.toLocaleString()}{' '}
            <span className="font-medium">{unit}</span>
          </p>
          <p className="text-[15px] text-gray-400 mt-2 leading-snug">{description}</p>
        </div>

        <Link
          href={ctaHref}
          className="shrink-0 flex items-center gap-2 bg-[#546070] text-white text-[15px] font-medium px-4 py-3 rounded-full hover:bg-[#455060] transition-colors whitespace-nowrap"
        >
          {ctaLabel}
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={18} color="white" strokeWidth={2} />
        </Link>
      </div>

    </div>
  )
}
