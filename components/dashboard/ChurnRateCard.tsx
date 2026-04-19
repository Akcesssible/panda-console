'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons-pro/core-stroke-rounded'

interface ChurnRateCardProps {
  churnData: { month: string; rate: number }[]
}

interface TooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
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

export function ChurnRateCard({ churnData }: ChurnRateCardProps) {
  const currentRate = churnData.at(-1)?.rate ?? 0
  const prevRate    = churnData.at(-2)?.rate ?? 0
  const delta       = Math.round((currentRate - prevRate) * 10) / 10

  const maxRate = Math.max(...churnData.map(d => d.rate), 1)
  const yMin    = 0
  const yMax    = Math.ceil(maxRate * 1.3 * 10) / 10

  const trendLabel = delta === 0
    ? 'No change vs last month'
    : `${delta > 0 ? '+' : ''}${delta}% vs last month`

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
          {currentRate}%
        </p>
        <p className="text-sm text-gray-400 mt-1">{trendLabel}</p>
      </div>

      {/* Chart */}
      <div className="-mx-1">
        <ResponsiveContainer width="100%" height={192}>
          <AreaChart
            data={churnData}
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
              domain={[yMin, yMax]}
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
