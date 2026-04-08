import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'

export interface StatItem {
  label: string
  value: string | number
  sub?: string
}

export function StatsRow({ stats }: { stats: StatItem[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div
        className="grid divide-x divide-gray-100"
        style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}
      >
        {stats.map((stat, i) => (
          <div key={i} className="px-6 py-5 flex flex-col gap-2">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-[2rem] font-semibold text-[#1d242d] tracking-[-1.5px] leading-none">
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            </p>
            <div className="flex items-center justify-between mt-auto">
              <p className="text-xs text-gray-400">{stat.sub ?? ''}</p>
              <HugeiconsIcon icon={InformationCircleIcon} size={14} color="#d1d5db" strokeWidth={1.5} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
