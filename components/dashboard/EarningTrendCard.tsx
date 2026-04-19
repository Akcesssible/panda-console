'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons-pro/core-stroke-rounded'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const today = new Date().getDay()
const todayIdx = today === 0 ? 6 : today - 1

interface EarningTrendCardProps {
  commissionTrend:   number[]
  subscriptionTrend: number[]
  commissionChange:   number | null
  subscriptionChange: number | null
}

// Tooltip: bubble above bar, arrow pointing DOWN toward the bar
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const val = Number(payload[0].value).toLocaleString()
  return (
    <div className="flex flex-col items-center pointer-events-none">
      <div className="bg-[#1a1f2e] text-white text-xs font-semibold px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
        TZS {val}
      </div>
      {/* Down-pointing arrow aimed at the bar below */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '7px solid #1a1f2e',
        }}
      />
    </div>
  )
}

// Custom bar shape: rounded rect + SVG inner shadow filter on active bar
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BarShape(props: any) {
  const { x, y, width, height, index } = props
  if (!width || !height || height <= 0) return null
  const r        = Math.min(12, width / 2, height / 2)
  const isActive = index === todayIdx

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={r}
      ry={r}
      fill={isActive ? '#2B39C7' : '#e8eafc'}
      filter={isActive ? 'url(#bar-inner-shadow)' : undefined}
    />
  )
}

export function EarningTrendCard({
  commissionTrend,
  subscriptionTrend,
  commissionChange,
  subscriptionChange,
}: EarningTrendCardProps) {
  const [mode, setMode] = useState<'commission' | 'subscription'>('commission')

  const trend  = mode === 'commission' ? commissionTrend : subscriptionTrend
  const change = mode === 'commission' ? commissionChange : subscriptionChange

  const data  = trend.map((v, i) => ({ day: DAYS[i], value: v }))
  const total = trend.reduce((s, v) => s + v, 0)

  const changeLabel = change === null
    ? null
    : `${change >= 0 ? '+' : ''}${change}%`

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-5">

      {/*
        Hidden SVG — defines the inner shadow filter globally so
        any SVG element in the page can reference it by id.
        Specs: x:0, y:-4, blur:4, color:#f2f2f2 @50%
        (stdDeviation = blur/2 = 2, matches Figma export convention)
      */}
      <svg width="0" height="0" style={{ position: 'absolute', overflow: 'hidden' }}>
        <defs>
          <filter id="bar-inner-shadow" colorInterpolationFilters="sRGB"
                  x="-20%" y="-20%" width="140%" height="140%">
            {/* 1. Flatten source into opaque shape */}
            <feFlood floodOpacity="0" result="bg" />
            <feBlend mode="normal" in="SourceGraphic" in2="bg" result="shape" />
            {/* 2. Extract solid alpha for masking */}
            <feColorMatrix in="SourceAlpha" type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 127 0"
              result="hardAlpha" />
            {/* 3. Offset (x:0, y:-4) then blur (stdDeviation:2 → blur:4) */}
            <feOffset dx="0" dy="-8" />
            <feGaussianBlur stdDeviation="2" />
            {/* 4. Clip to inside of the shape */}
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            {/* 5. Apply colour #f2f2f2 at 50% opacity
                   (0.949 ≈ 242/255 = 0xf2) */}
            <feColorMatrix type="matrix"
              values="0 0 0 0 0.949  0 0 0 0 0.949  0 0 0 0 0.949  0 0 0 0.5 0" />
            {/* 6. Blend inner shadow over the original shape */}
            <feBlend mode="normal" in2="shape" result="innerShadow" />
          </filter>
        </defs>
      </svg>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base font-medium text-[#1d242d] tracking-[-0.5px]">Earning Trend</span>
          <HugeiconsIcon icon={InformationCircleIcon} size={16} color="#9ca3af" strokeWidth={1.5} />
        </div>

        {/* Pill toggle */}
        <div className="flex items-center bg-[#DADFE5] rounded-full p-1 gap-0.5">
          {(['commission', 'subscription'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                mode === m
                  ? 'bg-white text-[#1d242d] shadow-sm'
                  : 'text-[#8e9ab8] hover:text-[#1d242d]'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Total + badge row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="leading-tight tracking-[-2px]" style={{ fontSize: 32, fontWeight: 600 }}>
            <span className="text-gray-400">TZS </span>
            <span className="text-[#1d242d]">{total.toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-400 mt-1">This Week</p>
        </div>
        {changeLabel && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-semibold bg-gray-100 text-[#1d242d] px-3 py-1 rounded-full">
              {changeLabel}
            </span>
            <span className="text-sm text-gray-400">vs last week</span>
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div className="-mx-1">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={data}
            margin={{ top: 12, right: 4, left: 4, bottom: 0 }}
            barSize={48}
            barCategoryGap={8}
          >
            <YAxis hide domain={[0, 'dataMax']} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 400 }}
              tickLine={false}
              axisLine={false}
              dy={6}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'transparent' }}
              wrapperStyle={{ zIndex: 10 }}
            />
            <Bar dataKey="value" shape={<BarShape />} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
