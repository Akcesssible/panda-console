'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatTZS } from '@/lib/utils'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const today = new Date().getDay() // 0=Sun, 1=Mon ...
const todayIdx = today === 0 ? 6 : today - 1

const MOCK_COMMISSION   = [180000, 220000, 150000, 270000, 310000, 390000, 250000]
const MOCK_SUBSCRIPTION = [210000, 190000, 240000, 300000, 280000, 350000, 220000]

export function EarningTrendCard() {
  const [mode, setMode] = useState<'commission' | 'subscription'>('commission')
  const data = (mode === 'commission' ? MOCK_COMMISSION : MOCK_SUBSCRIPTION).map((v, i) => ({ day: DAYS[i], value: v }))
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-[#1d242d]">Earning Trend</span>
          <InfoIcon />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['commission', 'subscription'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                mode === m ? 'bg-white text-[#1d242d] shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div>
        <p className="text-2xl font-bold text-[#2B39C7]">{formatTZS(total)}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">This Week</span>
          <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">+6.3% vs last week</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={24}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [formatTZS(Number(v)), mode === 'commission' ? 'Commission' : 'Subscription']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            cursor={{ fill: 'transparent' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === todayIdx ? '#2B39C7' : '#C8CEFA'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function InfoIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
    </svg>
  )
}
