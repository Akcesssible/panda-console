'use client'

import { KPICard } from '@/components/ui/KPICard'
import { formatTZS, timeAgo } from '@/lib/utils'

const TABS = [
  { key: 'drivers', label: 'Driver Performance' },
  { key: 'rides', label: 'Ride Analytics' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'churn', label: 'Churn Analysis' },
]

export function ReportsView({ tab, rows, summary }: {
  tab: string
  rows: Record<string, unknown>[]
  summary: Record<string, unknown>
}) {
  function exportCSV() {
    if (!rows.length) return
    const keys = Object.keys(rows[0])
    const csv = [
      keys.join(','),
      ...rows.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `panda-report-${tab}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {rows.length > 0 && (
          <div className="px-5 pt-4 flex justify-end">
            <button
              onClick={exportCSV}
              className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Export CSV
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div className="p-5">
          <SummaryCards tab={tab} summary={summary} />
        </div>
      </div>

      {/* Data table */}
      {rows.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {tab === 'drivers' && (
                    <>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide py-3 px-4">Driver</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide py-3 px-4">Total Trips</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide py-3 px-4">Completed</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide py-3 px-4">Cancelled</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide py-3 px-4">Rating</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide py-3 px-4">Last Active</th>
                    </>
                  )}
                  {tab === 'churn' && (
                    <>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide py-3 px-4">Driver</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide py-3 px-4">Last Active</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide py-3 px-4">Total Trips</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide py-3 px-4">Churn Reason</th>
                    </>
                  )}
                  {tab === 'revenue' && (
                    <>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide py-3 px-4">Date</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide py-3 px-4">Amount</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide py-3 px-4">Provider</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    {tab === 'drivers' && (
                      <>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{String(row.full_name)}</p>
                          <p className="text-xs text-gray-400">{String(row.driver_number)}</p>
                        </td>
                        <td className="py-3 px-4">{String(row.total_trips)}</td>
                        <td className="py-3 px-4 text-green-600">{String(row.completed_trips)}</td>
                        <td className="py-3 px-4 text-red-500">{String(row.cancelled_trips)}</td>
                        <td className="py-3 px-4">⭐ {Number(row.rating).toFixed(1)}</td>
                        <td className="py-3 px-4 text-gray-400 text-xs">{timeAgo(String(row.last_active_at))}</td>
                      </>
                    )}
                    {tab === 'churn' && (
                      <>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{String(row.full_name)}</p>
                          <p className="text-xs text-gray-400">{String(row.driver_number)}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">{timeAgo(String(row.last_active_at))}</td>
                        <td className="py-3 px-4">{String(row.total_trips)}</td>
                        <td className="py-3 px-4 text-xs text-gray-500">{String(row.churn_reason ?? 'Inactivity')}</td>
                      </>
                    )}
                    {tab === 'revenue' && (
                      <>
                        <td className="py-3 px-4 text-xs text-gray-500">{String(row.created_at).split('T')[0]}</td>
                        <td className="py-3 px-4 font-medium">{formatTZS(Number(row.amount_tzs))}</td>
                        <td className="py-3 px-4 capitalize">{String(row.provider ?? '—')}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCards({ tab, summary }: { tab: string; summary: Record<string, unknown> }) {
  if (tab === 'rides') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Rides" value={String(summary.total ?? 0)} />
        <KPICard label="Completed" value={String(summary.completed ?? 0)} />
        <KPICard label="Cancelled" value={String(summary.cancelled ?? 0)} />
        <KPICard label="Avg Fare" value={formatTZS(Number(summary.avgFare ?? 0))} />
      </div>
    )
  }
  if (tab === 'revenue') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KPICard label="Subscription Revenue (30d)" value={formatTZS(Number(summary.subRevenue ?? 0))} />
        <KPICard label="Commission Revenue (30d)" value={formatTZS(Number(summary.commRevenue ?? 0))} />
        <KPICard label="Total Revenue (30d)" value={formatTZS(Number(summary.total ?? 0))} />
      </div>
    )
  }
  if (tab === 'churn') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <KPICard label="Total Churned Drivers" value={String(summary.total ?? 0)} />
      </div>
    )
  }
  return null
}
