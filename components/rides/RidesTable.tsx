'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tabs } from '@/components/ui/Tabs'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { RideStatusBadge } from '@/components/ui/Badge'
import { formatTZS, timeAgo } from '@/lib/utils'
import type { Ride } from '@/lib/types'

interface Tab { key: string; label: string }

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

  // Subscribe to live ride updates when on live tab
  useEffect(() => {
    setRides(initialRides)
    if (!isLive) return

    const supabase = createClient()
    const channel = supabase
      .channel('live-rides')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'rides',
        filter: 'status=in.(requested,accepted,ongoing)',
      }, () => {
        // Re-trigger server-side refresh for accurate data
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

  const columns = [
    {
      key: 'ride_number',
      label: 'Ride ID',
      render: (row: Record<string, unknown>) => (
        <span className="font-mono text-sm font-medium text-gray-900">{(row as unknown as Ride).ride_number}</span>
      ),
    },
    {
      key: 'driver',
      label: 'Driver',
      render: (row: Record<string, unknown>) => {
        const r = row as unknown as Ride
        return r.drivers ? (
          <div>
            <p className="text-sm text-gray-900">{r.drivers.full_name}</p>
            <p className="text-xs text-gray-400">{r.drivers.driver_number}</p>
          </div>
        ) : <span className="text-gray-400 text-xs">Unassigned</span>
      },
    },
    {
      key: 'pickup_address',
      label: 'Route',
      render: (row: Record<string, unknown>) => {
        const r = row as unknown as Ride
        return (
          <div className="max-w-48">
            <p className="text-xs text-gray-700 truncate">{r.pickup_address}</p>
            <p className="text-xs text-gray-400 truncate">→ {r.destination_address}</p>
          </div>
        )
      },
    },
    {
      key: 'vehicle_type',
      label: 'Type',
      render: (row: Record<string, unknown>) => (
        <span className="text-xs capitalize text-gray-600">{(row as unknown as Ride).vehicle_type}</span>
      ),
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
        return fare != null ? <span className="text-sm">{formatTZS(fare)}</span> : <span className="text-gray-400">—</span>
      },
    },
    {
      key: 'requested_at',
      label: 'Time',
      render: (row: Record<string, unknown>) => (
        <span className="text-xs text-gray-400">{timeAgo((row as unknown as Ride).requested_at)}</span>
      ),
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 pt-4">
        <Tabs tabs={tabs} active={tab} onChange={key => navigate({ tab: key, page: '1' })} />
      </div>

      {isLive && (
        <div className="px-5 py-2 bg-green-50 border-b border-green-100">
          <span className="text-xs text-green-700 font-medium">
            ● Live — updates in real-time
          </span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={rides}
        onRowClick={row => router.push(`/rides/${(row as unknown as Ride).id}`)}
      />

      <Pagination page={page} total={total} perPage={20} onPageChange={p => navigate({ page: String(p) })} />
    </div>
  )
}
