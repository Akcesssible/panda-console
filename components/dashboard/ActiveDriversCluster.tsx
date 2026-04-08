import Image from 'next/image'
import { formatTZS } from '@/lib/utils'

interface Props {
  activeDrivers: number
  completedToday: number
  avgEarningsPerDriver: number
  subscriptionConversionRate: number
  activeSubscriptions: number
  totalDrivers: number
}

export function ActiveDriversCluster({
  activeDrivers, completedToday, avgEarningsPerDriver,
  subscriptionConversionRate, activeSubscriptions, totalDrivers,
}: Props) {
  return (
    <div className="rounded-2xl bg-white overflow-hidden flex flex-col space-y-2">
      {/* Daily Active Drivers — gradient card */}
      <div className="relative bg-gradient-to-br from-[#2B39C7] to-[#1a2499] mx-[.3rem] my-[.3rem] p-5 rounded-2xl flex-1 flex flex-col justify-between overflow-hidden">

        {/* Glow image — left-aligned, shifted up 56px */}
        <Image
          src="/glow_01.png"
          alt=""
          width={400}
          height={400}
          className="absolute left-0 pointer-events-none select-none"
          style={{ left: 180, top: -200, zIndex: 0 }}
          priority
        />

        {/* Header */}
        <span className="relative z-10 text-base font-medium text-[#f2f2f2] tracking-[-0.5px]">Daily Active Drivers</span>

        {/* Metrics group */}
        <div className="relative z-10">
          <p className="text-4xl font-semibold text-white mb-2 tracking[-.5px]">{activeDrivers.toLocaleString()}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-green-300 bg-green-400/20 px-2 py-0.5 rounded-full">+6.3%</span>
            <span className="text-xs text-blue-200">vs yesterday</span>
            <div className="ml-auto w-5 h-5 rounded-full border border-blue-300/40 flex items-center justify-center">
              <svg className="w-3 h-3 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>

      </div>

      {/* Sub KPIs — 2 col grid */}
      <div className="bg-white grid grid-cols-2 rounded-2xl divide-x divide-y divide-gray-100">
        <SubKPI
          label="Completed Trips Today"
          value={completedToday.toLocaleString()}
          sub={`+421 trips vs yesterday`}
          subColor="text-green-600"
        />
        <SubKPI
          label="Avg Earnings / Driver"
          value={formatTZS(avgEarningsPerDriver)}
          sub="Kinondoni | Highest Zone"
        />
        <SubKPI
          label="Subscription Conversion"
          value={`${subscriptionConversionRate}%`}
          sub={`${activeSubscriptions.toLocaleString()} of ${totalDrivers.toLocaleString()} subscribed`}
        />
      </div>
    </div>
  )
}

function SubKPI({ label, value, sub, subColor = 'text-gray-400' }: {
  label: string; value: string; sub: string; subColor?: string
}) {
  return (
    <div className="p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-[#1d242d]">{value}</p>
      <p className={`text-xs mt-0.5 ${subColor}`}>{sub}</p>
    </div>
  )
}
