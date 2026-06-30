'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { RideStatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatTZS, timeAgoShort } from '@/lib/utils'
import type { Ride } from '@/lib/types'

interface Tab { key: string; label: string }

const CARD_TITLES: Record<string, string> = {
  live: 'Live Rides',
  history: 'Ride History',
  cancelled: 'Cancelled Rides',
  flagged: 'Flagged Rides',
}

export function RidesTable({
  rides: initialRides, total, page, tab, tabs, isLive, search,
}: {
  rides: Ride[]
  total: number
  page: number
  tab: string
  tabs: Tab[]
  isLive: boolean
  search?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [rides, setRides] = useState<Ride[]>(initialRides)

  useEffect(() => {
    setRides(initialRides)
  }, [initialRides])

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k) })
    router.push(`/rides?${params.toString()}`)
  }

  const displayRides: Ride[] = rides
  const displayTotal = total

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
          <div className="flex items-center gap-3">
            <Avatar id={r.driver_id ?? r.id} name={r.drivers.full_name} size="md" />
            <div className="min-w-0">
              <p className="font-medium text-[#1d242d]">{r.drivers.full_name}</p>
              <p className="text-xs text-gray-400">{r.drivers.driver_number}</p>
            </div>
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
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      {isLive && (
        <div className="px-6 py-2 bg-green-50 border-b border-green-100 rounded-t-2xl">
          <span className="text-xs text-green-700 font-medium">● Live — updates in real-time</span>
        </div>
      )}
      <DataTable
        columns={columns}
        data={displayRides}
        cardTitle={CARD_TITLES[tab] ?? 'Rides'}
        searchValue={search ?? ''}
        onSearch={v => navigate({ search: v, page: '1' })}
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
