'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { SearchBar } from '@/components/ui/SearchBar'
import { FilterButton } from '@/components/ui/FilterButton'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons-pro/core-stroke-rounded'
import { formatTZS } from '@/lib/utils'
import type { BadgeVariant } from '@/components/ui/Badge'

interface Ride {
  id: string
  ride_number: string
  pickup_address: string
  destination_address: string
  status: string
  total_fare_tzs: number | null
  commission_tzs: number | null
  driver_earnings_tzs: number | null
  requested_at: string
  completed_at: string | null
  accepted_at: string | null
}

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  completed: 'green',
  cancelled: 'red',
  ongoing:   'blue',
  accepted:  'blue',
  requested: 'yellow',
}

const DRIVER_ACTION_VARIANT: Record<string, BadgeVariant> = {
  completed: 'green',
  cancelled: 'red',
  ongoing:   'blue',
  accepted:  'blue',
  requested: 'yellow',
  missed:    'gray',
}

function formatShortDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const PER_PAGE = 5

export function DriverRideHistory({ rides }: { rides: Ride[] }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = rides.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.ride_number.toLowerCase().includes(q)
      || r.pickup_address.toLowerCase().includes(q)
      || r.destination_address.toLowerCase().includes(q)
      || r.status.toLowerCase().includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function driverAction(status: string) {
    if (status === 'completed') return { label: 'Accepted',    variant: 'green' as BadgeVariant }
    if (status === 'cancelled') return { label: 'No Response', variant: 'gray'  as BadgeVariant }
    if (status === 'ongoing')   return { label: 'Accepted',    variant: 'blue'  as BadgeVariant }
    if (status === 'accepted')  return { label: 'Accepted',    variant: 'blue'  as BadgeVariant }
    return { label: 'Missed', variant: 'gray' as BadgeVariant }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-1.5 w-1/2">
          <span className="text-base font-medium text-[#1d242d]">Driver Trip Activity</span>
          <HugeiconsIcon icon={InformationCircleIcon} size={15} color="#d1d5db" strokeWidth={1.5} />
        </div>
        <div className="flex items-center gap-2 w-1/2">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search" className="flex-1" />
          <FilterButton />
        </div>
      </div>

      {/* Column headers */}
      <div className="grid px-5 py-3 border-b border-gray-100 text-sm font-semibold text-[#1d242d]"
        style={{ gridTemplateColumns: '1.4fr 2fr 1.4fr 1fr 1fr' }}>
        <span>Ride ID</span>
        <span>Route</span>
        <span>Fare &amp; Commission</span>
        <span>Status</span>
        <span>Driver action</span>
      </div>

      {/* Rows */}
      {paginated.length === 0 ? (
        <div className="px-5 py-10 text-sm text-gray-400 text-center">No rides found</div>
      ) : (
        paginated.map((ride, i) => {
          const action = driverAction(ride.status)
          const isEven = i % 2 === 1
          return (
            <div
              key={ride.id}
              className={`grid px-5 py-3.5 items-center text-sm ${isEven ? 'bg-[#F5F7FF]' : 'bg-white'}`}
              style={{ gridTemplateColumns: '1.4fr 2fr 1.4fr 1fr 1fr' }}
            >
              {/* Ride ID + date */}
              <div>
                <p className="font-medium text-[#1d242d]">{ride.ride_number}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatShortDate(ride.requested_at)}</p>
              </div>

              {/* Route */}
              <span className="text-gray-600 truncate">
                {ride.pickup_address} → {ride.destination_address}
              </span>

              {/* Fare & Commission */}
              <div>
                {ride.total_fare_tzs != null ? (
                  <>
                    <p className="text-[#1d242d]">{formatTZS(ride.total_fare_tzs)}</p>
                    <p className="text-xs text-gray-400">{ride.commission_tzs != null ? formatTZS(ride.commission_tzs) : '—'}</p>
                  </>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>

              {/* Status pill */}
              <span className="flex items-center">
                <Badge variant={STATUS_VARIANT[ride.status] ?? 'gray'}>
                  {ride.status}
                </Badge>
              </span>

              {/* Driver action */}
              <span className="text-sm text-gray-600">{action.label}</span>
            </div>
          )
        })
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
        <span className="text-sm text-gray-500">Total Data: {filtered.length}</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                p === page ? 'bg-[#1d242d] text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <span>{PER_PAGE} Items per page</span>
        </div>
      </div>
    </div>
  )
}
