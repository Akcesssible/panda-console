import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { formatTZS } from '@/lib/utils'
import type { Driver } from '@/lib/types'

interface Props {
  driver: Driver
  todayTrips: number
}

export function DriverStats({ driver, todayTrips }: Props) {
  const avgEarningsPerDay = driver.total_trips > 0
    ? (driver.total_trips * 4200) / Math.max(1, driver.total_trips / 10)
    : 0
  const completionRate = driver.total_trips > 0
    ? Math.round((driver.completed_trips / driver.total_trips) * 100)
    : 0

  const stats = [
    {
      label: 'Trips Today',
      value: todayTrips,
      sub: 'Active 5 minutes ago',
    },
    {
      label: 'Total Trips',
      value: driver.total_trips.toLocaleString(),
      badges: [
        { text: `${driver.completed_trips.toLocaleString()} Completed Trips`, color: 'bg-green-50 text-green-600 border border-green-200' },
        { text: `${driver.cancelled_trips} Canceled Trips`, color: 'bg-red-50 text-red-500 border border-red-200' },
      ],
    },
    {
      label: 'Avg Earnings / Day',
      value: formatTZS(avgEarningsPerDay),
      sub: `${completionRate}% Completion Rate`,
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#1d242d]">{stat.label}</p>
            <HugeiconsIcon icon={InformationCircleIcon} size={15} color="#d1d5db" strokeWidth={1.5} />
          </div>

          <p className="text-3xl font-semibold text-[#1d242d] tracking-[-1px] leading-none">
            {stat.value}
          </p>

          {stat.badges ? (
            <div className="flex flex-wrap gap-1.5">
              {stat.badges.map((b, j) => (
                <span key={j} className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${b.color}`}>
                  {b.text}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">{stat.sub}</p>
          )}
        </div>
      ))}
    </div>
  )
}
