'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const MOCK_CHURN = [
  { month: 'Jul', rate: 5.0 },
  { month: 'Aug', rate: 4.9 },
  { month: 'Sep', rate: 4.7 },
  { month: 'Oct', rate: 4.5 },
  { month: 'Nov', rate: 4.3 },
  { month: 'Dec', rate: 4.1 },
]

export function ChurnRateCard() {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-[#1d242d]">Driver Churn Rate</span>
        <svg className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
        </svg>
      </div>

      {/* Metric */}
      <div>
        <p className="text-3xl font-bold text-[#1d242d]">4.1%</p>
        <p className="text-xs text-gray-400 mt-1">
          <span className="text-green-600 font-medium">−0.6%</span> vs last month
        </p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={MOCK_CHURN} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
          <YAxis
            domain={[3.8, 5.2]}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `${v}%`}
            width={32}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [`${v}%`, 'Churn Rate']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#ef4444' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
