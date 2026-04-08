'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { RideStatusBadge } from '@/components/ui/Badge'
import { formatTZS, timeAgoShort } from '@/lib/utils'
import type { Ride } from '@/lib/types'

interface Tab { key: string; label: string }

const CARD_TITLES: Record<string, string> = {
  live: 'Live Rides',
  history: 'Ride History',
  cancelled: 'Cancelled Rides',
  flagged: 'Flagged Rides',
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_RIDES = [
  { id: 'm1', ride_number: 'R-00001', status: 'ongoing',   vehicle_type: 'car',      total_fare_tzs: 4500,  requested_at: new Date(Date.now() - 5*60_000).toISOString(),   drivers: { full_name: 'John Mawella',  driver_number: 'DRV-000001' }, pickup_address: 'Kariakoo Market', destination_address: 'Mlimani City' },
  { id: 'm2', ride_number: 'R-00002', status: 'completed', vehicle_type: 'bajaj',    total_fare_tzs: 2200,  requested_at: new Date(Date.now() - 20*60_000).toISOString(),  drivers: { full_name: 'Asha Kassim',   driver_number: 'DRV-000002' }, pickup_address: 'Ubungo Terminal', destination_address: 'Sinza' },
  { id: 'm3', ride_number: 'R-00003', status: 'requested', vehicle_type: 'car',      total_fare_tzs: null,  requested_at: new Date(Date.now() - 2*60_000).toISOString(),   drivers: null, pickup_address: 'Posta', destination_address: 'Mikocheni' },
  { id: 'm4', ride_number: 'R-00004', status: 'cancelled', vehicle_type: 'bodaboda', total_fare_tzs: null,  requested_at: new Date(Date.now() - 60*60_000).toISOString(),  drivers: { full_name: 'Sofia Lee',     driver_number: 'DRV-000004' }, pickup_address: 'Buguruni', destination_address: 'Tabata' },
  { id: 'm5', ride_number: 'R-00005', status: 'completed', vehicle_type: 'car',      total_fare_tzs: 8700,  requested_at: new Date(Date.now() - 3*3600_000).toISOString(), drivers: { full_name: 'Ethan Wright',  driver_number: 'DRV-000006' }, pickup_address: 'Julius Nyerere Airport', destination_address: 'Sea Cliff Hotel' },
]

export function RidesTable({
  rides: initialRides, total, page, tab, tabs, isLive,
}: {
  rides: Ride[]
  total: number
  page: number
  tab: string
  tabs: Tab[]
  isLive: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [rides, setRides] = useState<Ride[]>(initialRides)

  useEffect(() => {
    setRides(initialRides)
    if (!isLive) return
    const supabase = createClient()
    const channel = supabase
      .channel('live-rides')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides', filter: 'status=in.(requested,accepted,ongoing)' }, () => {
        router.refresh()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [isLive, initialRides, router])

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k) })
    router.push(`/rides?${params.toString()}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displayRides: any[] = rides.length > 0 ? rides : MOCK_RIDES
  const displayTotal = rides.length > 0 ? total : MOCK_RIDES.length

  const columns = [
    {
      key: 'ride_number',
      label: 'Ride ID',
      render: (row: Record<string, unknown>) => (
        <span className="font-mono font-semibold text-[#1d242d]">{(row as unknown as Ride).ride_number}</span>
      ),
    },
    {
      key: 'driver',
      label: 'Driver',
      render: (row: Record<string, unknown>) => {
        const r = row as unknown as Ride
        return r.drivers ? (
          <div>
            <p className="font-medium text-[#1d242d]">{r.drivers.full_name}</p>
            <p className="text-xs text-gray-400">{r.drivers.driver_number}</p>
          </div>
        ) : <span className="text-gray-400 text-sm">Unassigned</span>
      },
    },
    {
      key: 'pickup_address',
      label: 'Route',
      render: (row: Record<string, unknown>) => {
        const r = row as unknown as Ride
        return (
          <div className="max-w-48">
            <p className="text-sm text-[#1d242d] truncate">{r.pickup_address}</p>
            <p className="text-xs text-gray-400 truncate">→ {r.destination_address}</p>
          </div>
        )
      },
    },
    {
      key: 'vehicle_type',
      label: 'Vehicle Type',
      render: (row: Record<string, unknown>) => {
        const labels: Record<string, string> = { car: 'Car', bajaj: 'Bajaj', bodaboda: 'Boda' }
        const vt = (row as unknown as Ride).vehicle_type ?? ''
        return <span className="font-semibold text-[#1d242d]">{labels[vt] ?? vt}</span>
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Record<string, unknown>) => <RideStatusBadge status={(row as unknown as Ride).status} />,
    },
    {
      key: 'total_fare_tzs',
      label: 'Fare',
      render: (row: Record<string, unknown>) => {
        const fare = (row as unknown as Ride).total_fare_tzs
        return fare != null ? <span>{formatTZS(fare)}</span> : <span className="text-gray-400">—</span>
      },
    },
    {
      key: 'requested_at',
      label: 'Time',
      render: (row: Record<string, unknown>) => (
        <span className="text-gray-400 text-sm">{timeAgoShort((row as unknown as Ride).requested_at)}</span>
      ),
    },
  ]

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm">
      {isLive && (
        <div className="px-6 py-2 bg-green-50 border-b border-green-100 rounded-t-2xl">
          <span className="text-xs text-green-700 font-medium">● Live — updates in real-time</span>
        </div>
      )}
      <DataTable
        columns={columns}
        data={displayRides}
        cardTitle={CARD_TITLES[tab] ?? 'Rides'}
        selectable
        rowActions={row => [
          { label: 'View Details', onClick: () => router.push(`/rides/${(row as Ride).id}`) },
          { label: 'Flag Ride', onClick: () => router.push(`/rides/${(row as Ride).id}?action=flag`), danger: true },
        ]}
        onRowClick={row => router.push(`/rides/${(row as unknown as Ride).id}`)}
      />
      <Pagination page={page} total={displayTotal} perPage={20} onPageChange={p => navigate({ page: String(p) })} />
    </div>
  )
}
