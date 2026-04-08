'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

// Static placeholder data — replaced by real data from API via parent
const MOCK_DATA = [
  { day: 'Mon', commission: 180000, subscription: 210000 },
  { day: 'Tue', commission: 220000, subscription: 190000 },
  { day: 'Wed', commission: 150000, subscription: 240000 },
  { day: 'Thu', commission: 270000, subscription: 300000 },
  { day: 'Fri', commission: 310000, subscription: 280000 },
  { day: 'Sat', commission: 390000, subscription: 350000 },
  { day: 'Sun', commission: 250000, subscription: 220000 },
]

function formatYAxis(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return String(value)
}

export function EarningsTrendChart({ data = MOCK_DATA }: { data?: typeof MOCK_DATA }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
        <Tooltip
          formatter={(value: number) => [`TZS ${value.toLocaleString()}`, '']}
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
