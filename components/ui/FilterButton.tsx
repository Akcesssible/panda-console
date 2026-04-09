'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { FilterHorizontalIcon } from '@hugeicons-pro/core-stroke-rounded'

interface FilterButtonProps {
  onClick?: () => void
  active?: boolean
  label?: string
}

export function FilterButton({ onClick, active = false, label = 'Filter' }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border transition-colors whitespace-nowrap ${
        active
          ? 'border-[#2B39C7] text-[#2B39C7] bg-[#eef0fb]'
          : 'border-gray-300 text-[#1d242d] bg-white hover:bg-gray-50'
      }`}
    >
      <HugeiconsIcon icon={FilterHorizontalIcon} size={15} color="currentColor" strokeWidth={1.8} />
      {label}
    </button>
  )
}
