'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

function formatYAxis(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return String(value)
}

type ChartEntry = { day: string; commission: number; subscription: number }

export function EarningsTrendChart({ data = [] }: { data?: ChartEntry[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">No data yet</div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [`TZS ${Number(value).toLocaleString()}`, '']}
          labelStyle={{ fontSize: 12 }}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone" dataKey="subscription" name="Subscription"
          stroke="#2563eb" strokeWidth={2} dot={false} activeDot={{ r: 4 }}
        />
        <Line
          type="monotone" dataKey="commission" name="Commission"
          stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
