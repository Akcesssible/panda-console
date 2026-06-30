'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate, formatTZS } from '@/lib/utils'
import type { CommissionRide } from '@/lib/queries/commissions'

const VEHICLE_LABELS: Record<string, string> = { bodaboda: 'Bodaboda', bajaj: 'Bajaj', car: 'Car' }

const columns = [
  {
    key: 'driver', label: 'Driver',
    render: (row: Record<string, unknown>) => {
      const r = row as unknown as CommissionRide
      // Active subscribers are excluded at query level — badge means expired sub
      const hadSub = (r.drivers?.driver_subscriptions?.length ?? 0) > 0
      return r.drivers ? (
        <div className="flex items-center gap-3">
          <Avatar id={r.driver_id ?? r.id} name={r.drivers.full_name} size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-[#1d242d]">{r.drivers.full_name}</p>
              {hadSub && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Subscribed
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">{r.drivers.driver_number}</p>
          </div>
        </div>
      ) : <span className="text-gray-400">—</span>
    },
  },
  {
    key: 'ride_number', label: 'Ride #',
    render: (row: Record<string, unknown>) => {
      const r = row as unknown as CommissionRide
      return <span className="font-mono font-semibold text-[#1d242d]">{r.ride_number}</span>
    },
  },
  {
    key: 'vehicle_type', label: 'Vehicle',
    render: (row: Record<string, unknown>) => {
      const r = row as unknown as CommissionRide
      return <span className="font-semibold text-[#1d242d]">{VEHICLE_LABELS[r.vehicle_type] ?? r.vehicle_type}</span>
    },
  },
  {
    key: 'total_fare_tzs', label: 'Ride Fare',
    render: (row: Record<string, unknown>) => {
      const r = row as unknown as CommissionRide
      return <span>{formatTZS(r.total_fare_tzs ?? 0)}</span>
    },
  },
  {
    key: 'commission_rate', label: 'Rate',
    render: (row: Record<string, unknown>) => {
      const r = row as unknown as CommissionRide
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EEF0FD] text-[#2B39C7]">
          {Math.round(r.commission_rate * 100)}%
        </span>
      )
    },
  },
  {
    key: 'commission_tzs', label: 'Commission',
    render: (row: Record<string, unknown>) => {
      const r = row as unknown as CommissionRide
      return <span className="font-semibold text-green-700">{formatTZS(r.commission_tzs)}</span>
    },
  },
  {
    key: 'driver_earnings_tzs', label: 'Driver Earned',
    render: (row: Record<string, unknown>) => {
      const r = row as unknown as CommissionRide
      return <span className="text-gray-500">{formatTZS(r.driver_earnings_tzs ?? 0)}</span>
    },
  },
  {
    key: 'completed_at', label: 'Date',
    render: (row: Record<string, unknown>) => {
      const r = row as unknown as CommissionRide
      return <span className="text-gray-400">{r.completed_at ? formatDate(r.completed_at) : '—'}</span>
    },
  },
]

export function CommissionsView({
  commissions,
  commissionsTotal,
  page,
}: {
  commissions: CommissionRide[]
  commissionsTotal: number
  page: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k) })
    router.push(`/commissions?${params.toString()}`)
  }

  const displayCommissions = commissions
  const displayTotal       = commissionsTotal

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <DataTable
        columns={columns}
        data={displayCommissions as unknown as Record<string, unknown>[]}
        cardTitle="Commission Rides"
        selectable
        rowActions={row => {
          const r = row as unknown as CommissionRide
          return [
            { label: 'View Ride',   onClick: () => router.push(`/rides/${r.id}`) },
            { label: 'View Driver', onClick: () => router.push(`/drivers/${r.driver_id}`) },
          ]
        }}
        onRowClick={row => router.push(`/rides/${(row as unknown as CommissionRide).id}`)}
      />
      <Pagination
        page={page}
        total={displayTotal}
        perPage={20}
        onPageChange={p => navigate({ page: String(p) })}
      />
    </div>
  )
}
