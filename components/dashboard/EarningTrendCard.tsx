'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons-pro/core-stroke-rounded'

export function EarningTrendCard() {
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-5">

      {/* Header row */}
      <div className="flex items-center gap-1.5">
        <span className="text-base font-medium text-[#1d242d] tracking-[-0.5px]">Earning Trend</span>
        <HugeiconsIcon icon={InformationCircleIcon} size={16} color="#9ca3af" strokeWidth={1.5} />
      </div>

      {/* Chart placeholder */}
      <div className="flex items-center justify-center h-full text-sm text-gray-400">No data yet</div>
    </div>
  )
}
