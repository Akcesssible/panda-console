'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { formatDate, formatTZS } from '@/lib/utils'
import type { CommissionRide } from '@/lib/queries/commissions'

// ── Mock data ─────────────────────────────────────────────────────────────────
// Active subscribers are excluded at the query level. The "Subscribed" badge
// means the driver holds an expired/grace subscription — they once had a plan
// but it lapsed, so their rides are now commission-bearing again.
const MOCK_COMMISSIONS: CommissionRide[] = [
  { id: 'r1', ride_number: 'RDE-000101', driver_id: 'd12', vehicle_type: 'bodaboda', total_fare_tzs: 12000, commission_rate: 0.20, commission_tzs: 2400,  driver_earnings_tzs: 9600,  completed_at: '2026-04-08T10:30:00Z', drivers: { full_name: 'Ali Hassan',      driver_number: 'DRV-000012', phone: '0712 111 222', driver_subscriptions: [] } },
  { id: 'r2', ride_number: 'RDE-000102', driver_id: 'd15', vehicle_type: 'bajaj',    total_fare_tzs: 18000, commission_rate: 0.20, commission_tzs: 3600,  driver_earnings_tzs: 14400, completed_at: '2026-04-08T09:15:00Z', drivers: { full_name: 'Fatuma Salim',    driver_number: 'DRV-000015', phone: '0754 333 444', driver_subscriptions: [{ status: 'expired' }] } },
  { id: 'r3', ride_number: 'RDE-000103', driver_id: 'd9',  vehicle_type: 'car',      total_fare_tzs: 35000, commission_rate: 0.20, commission_tzs: 7000,  driver_earnings_tzs: 28000, completed_at: '2026-04-07T16:45:00Z', drivers: { full_name: 'James Mwangi',    driver_number: 'DRV-000009', phone: '0789 555 666', driver_subscriptions: [] } },
  { id: 'r4', ride_number: 'RDE-000104', driver_id: 'd21', vehicle_type: 'bodaboda', total_fare_tzs: 8500,  commission_rate: 0.20, commission_tzs: 1700,  driver_earnings_tzs: 6800,  completed_at: '2026-04-07T14:20:00Z', drivers: { full_name: 'Grace Odhiambo', driver_number: 'DRV-000021', phone: '0798 777 888', driver_subscriptions: [] } },
  { id: 'r5', ride_number: 'RDE-000105', driver_id: 'd33', vehicle_type: 'bajaj',    total_fare_tzs: 22000, commission_rate: 0.20, commission_tzs: 4400,  driver_earnings_tzs: 17600, completed_at: '2026-04-06T11:00:00Z', drivers: { full_name: 'Moses Kariuki',   driver_number: 'DRV-000033', phone: '0765 999 000', driver_subscriptions: [{ status: 'expired' }] } },
  { id: 'r6', ride_number: 'RDE-000106', driver_id: 'd41', vehicle_type: 'car',      total_fare_tzs: 48000, commission_rate: 0.20, commission_tzs: 9600,  driver_earnings_tzs: 38400, completed_at: '2026-04-06T08:30:00Z', drivers: { full_name: 'Sarah Mutua',     driver_number: 'DRV-000041', phone: '0800 112 233', driver_subscriptions: [] } },
]

const VEHICLE_LABELS: Record<string, string> = { bodaboda: 'Bodaboda', bajaj: 'Bajaj', car: 'Car' }

const columns = [
  {
    key: 'driver', label: 'Driver',
    render: (row: Record<string, unknown>) => {
      const r = row as unknown as CommissionRide
      // Active subscribers are excluded at query level — badge means expired sub
      const hadSub = (r.drivers?.driver_subscriptions?.length ?? 0) > 0
      return r.drivers ? (
        <div>
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
  useMock,
}: {
  commissions: CommissionRide[]
  commissionsTotal: number
  page: number
  useMock?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k) })
    router.push(`/commissions?${params.toString()}`)
  }

  const displayCommissions = (useMock && commissions.length === 0) ? MOCK_COMMISSIONS : commissions
  const displayTotal       = (useMock && commissions.length === 0) ? MOCK_COMMISSIONS.length : commissionsTotal

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
