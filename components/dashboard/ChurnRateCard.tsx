'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'

const MOCK_CHURN = [
  { month: 'Jul', rate: 4.98 },
  { month: 'Aug', rate: 4.85 },
  { month: 'Sep', rate: 4.68 },
  { month: 'Oct', rate: 4.52 },
  { month: 'Nov', rate: 4.31 },
  { month: 'Dec', rate: 4.10 },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="flex flex-col items-center pointer-events-none">
      <div className="bg-[#1a1f2e] text-white text-xs font-semibold px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
        {label} — {payload[0].value}%
      </div>
      <div
        style={{
          width: 0, height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '7px solid #1a1f2e',
        }}
      />
    </div>
  )
}

export function ChurnRateCard() {
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-5">

      {/* Header — same pattern as EarningTrendCard */}
      <div className="flex items-center gap-1.5">
        <span className="text-base font-medium text-[#1d242d] tracking-[-0.5px]">Driver Churn Rate</span>
        <HugeiconsIcon icon={InformationCircleIcon} size={16} color="#9ca3af" strokeWidth={1.5} />
      </div>

      {/* Metric */}
      <div>
        <p className="leading-tight tracking-[-2px]" style={{ fontSize: 32, fontWeight: 600, color: '#1d242d' }}>
          4.1%
        </p>
        <p className="text-sm text-gray-400 mt-1">−0.6% vs last month</p>
      </div>

      {/* Chart */}
      <div className="-mx-1">
        <ResponsiveContainer width="100%" height={192}>
          <AreaChart
            data={MOCK_CHURN}
            margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="churnAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#ef4444" stopOpacity={0.13} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0}    />
              </linearGradient>
            </defs>

            {/* Subtle dashed horizontal grid lines only */}
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#ebebeb"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#b0b8c4', fontWeight: 400 }}
              tickLine={false}
              axisLine={false}
              dy={6}
            />

            <YAxis
              domain={[3.9, 5.1]}
              ticks={[4.0, 4.4, 4.8, 5.0]}
              tickFormatter={v => `${v}%`}
              tick={{ fontSize: 10, fill: '#b0b8c4', fontWeight: 400 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#ef4444', strokeWidth: 1, strokeDasharray: '3 3' }}
            />

            <Area
              type="monotone"
              dataKey="rate"
              stroke="#ef4444"
              strokeWidth={2.5}
              fill="url(#churnAreaGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#ef4444',
                stroke: '#ffffff',
                strokeWidth: 2.5,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
