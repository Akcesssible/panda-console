import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'

export interface StatItem {
  label: string
  value: string | number
  subBadge?: string   // pill text e.g. "+421 trips" or "Kinondoni"
  subText?: string    // plain text after badge e.g. "vs yesterday"
}

export function StatsRow({ stats }: { stats: StatItem[] }) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}
    >
      {stats.map((stat, i) => (
        <div key={i} className="bg-[#ECEEF3] rounded-2xl px-6 py-5 flex flex-col gap-5">
          {/* Label */}
          <p className="text-sm text-[#1d242d]">{stat.label}</p>

          {/* Big number */}
          <p className="text-5xl font-semibold text-[#1d242d] tracking-[-2px] leading-none">
            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
          </p>

          {/* Bottom row — badge + description + info icon */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {stat.subBadge && (
                <span className="shrink-0 bg-white text-[#1d242d] text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                  {stat.subBadge}
                </span>
              )}
              {stat.subText && (
                <span className="text-xs text-gray-500 truncate">{stat.subText}</span>
              )}
            </div>
            <HugeiconsIcon icon={InformationCircleIcon} size={16} color="#c0c4cc" strokeWidth={1.5} className="shrink-0" />
          </div>
        </div>
      ))}
    </div>
  )
}
