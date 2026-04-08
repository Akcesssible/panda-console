'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search', className = '' }: SearchBarProps) {
  return (
    <div className={`flex items-center bg-white border border-gray-300 rounded-full overflow-hidden ${className}`}>
      <div className="flex items-center justify-center w-9 h-9 bg-[#EBEBED] rounded-full m-0.5 shrink-0">
        <HugeiconsIcon icon={Search01Icon} size={15} color="#2B39C7" strokeWidth={2} />
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 text-sm bg-transparent outline-none text-[#1d242d] placeholder-gray-400 min-w-0"
      />
    </div>
  )
}
