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

  return (
    <div className="bg-white rounded-3xl p-4 grid grid-cols-3 gap-3">

      {/* Trips Today */}
      <div className="bg-[#ECEEF3] rounded-2xl px-6 py-5 flex flex-col justify-between">
        <p className="text-sm text-[#1d242d]">Trips Today</p>
        <div className="flex flex-col gap-3">
          <p className="text-5xl font-semibold text-[#1d242d] tracking-[-2px] leading-none">
            {todayTrips}
          </p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0 bg-white text-[#1d242d] text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                Active 5 minutes ago
              </span>
            </div>
            <HugeiconsIcon icon={InformationCircleIcon} size={16} color="#c0c4cc" strokeWidth={1.5} className="shrink-0" />
          </div>
        </div>
      </div>

      {/* Total Trips */}
      <div className="bg-[#ECEEF3] rounded-2xl px-6 py-5 flex flex-col justify-between">
        <p className="text-sm text-[#1d242d]">Total Trips</p>
        <div className="flex flex-col gap-3">
          <p className="text-5xl font-semibold text-[#1d242d] tracking-[-2px] leading-none">
            {driver.total_trips.toLocaleString()}
          </p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className="shrink-0 bg-green-100 text-green-700 border border-green-200 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                {driver.completed_trips.toLocaleString()} Completed Trips
              </span>
              <span className="shrink-0 bg-red-50 text-red-500 border border-red-200 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                {driver.cancelled_trips} Canceled Trips
              </span>
            </div>
            <HugeiconsIcon icon={InformationCircleIcon} size={16} color="#c0c4cc" strokeWidth={1.5} className="shrink-0" />
          </div>
        </div>
      </div>

      {/* Avg Earnings / Day */}
      <div className="bg-[#ECEEF3] rounded-2xl px-6 py-5 flex flex-col justify-between">
        <p className="text-sm text-[#1d242d]">Avg Earnings / Day</p>
        <div className="flex flex-col gap-3">
          <p className="text-4xl font-semibold text-[#1d242d] tracking-[-2px] leading-none">
            {formatTZS(avgEarningsPerDay)}
          </p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0 bg-white text-[#1d242d] text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                {completionRate}% Completion Rate
              </span>
            </div>
            <HugeiconsIcon icon={InformationCircleIcon} size={16} color="#c0c4cc" strokeWidth={1.5} className="shrink-0" />
          </div>
        </div>
      </div>

    </div>
  )
}
