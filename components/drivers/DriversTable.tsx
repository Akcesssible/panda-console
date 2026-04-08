'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs } from '@/components/ui/Tabs'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { DriverStatusBadge, SubscriptionBadge, Badge } from '@/components/ui/Badge'
import { formatDate, timeAgo } from '@/lib/utils'
import type { Driver } from '@/lib/types'

interface Tab { key: string; label: string }

export function DriversTable({
  drivers, total, page, tab, tabs, search,
}: {
  drivers: Driver[]
  total: number
  page: number
  tab: string
  tabs: Tab[]
  search?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k) })
    router.push(`/drivers?${params.toString()}`)
  }

  const columns = getColumns(tab)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Tabs */}
      <div className="px-5 pt-4">
        <Tabs
          tabs={tabs}
          active={tab}
          onChange={key => navigate({ tab: key, page: '1' })}
        />
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-gray-100">
        <input
          defaultValue={search}
          placeholder="Search by name, phone, or driver number..."
          className="w-64 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary$"
          onChange={e => navigate({ search: e.target.value, page: '1' })}
        />
        <span className="ml-4 text-sm text-gray-500">Total: {total.toLocaleString()}</span>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={drivers}
        onRowClick={(row: Driver) => router.push(`/drivers/${row.id}`)}
      />

      <Pagination page={page} total={total} perPage={20} onPageChange={p => navigate({ page: String(p) })} />
    </div>
  )
}

function getColumns(tab: string) {
  const base = [
    {
      key: 'full_name',
      label: 'Driver Name',
      render: (row: Record<string, unknown>) => {
        const d = row as unknown as Driver
        return (
          <div>
            <p className="font-medium text-gray-900">{d.full_name}</p>
            <p className="text-xs text-gray-400">{d.driver_number}</p>
          </div>
        )
      },
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (row: Record<string, unknown>) => (row as unknown as Driver).phone,
    },
    {
      key: 'vehicle_type',
      label: 'Vehicle',
      render: (row: Record<string, unknown>) => {
        const d = row as unknown as Driver
        const v = d.vehicles?.[0]
        if (!v) return <span className="text-gray-400">—</span>
        return <span className="capitalize">{v.vehicle_type}</span>
      },
    },
  ]

  if (tab === 'all') {
    return [
      ...base,
      {
        key: 'subscription',
        label: 'Subscription',
        render: (row: Record<string, unknown>) => {
          const d = row as unknown as Driver
          const sub = d.driver_subscriptions?.[0]
          return sub ? <SubscriptionBadge status={sub.status} /> : <span className="text-gray-400 text-xs">None</span>
        },
      },
      {
        key: 'total_trips',
        label: 'Total Trips',
        render: (row: Record<string, unknown>) => (row as unknown as Driver).total_trips,
      },
      {
        key: 'status',
        label: 'Status',
        render: (row: Record<string, unknown>) => <DriverStatusBadge status={(row as unknown as Driver).status} />,
      },
      {
        key: 'last_active_at',
        label: 'Last Active',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-500 text-xs">{timeAgo((row as unknown as Driver).last_active_at ?? undefined)}</span>
        ),
      },
    ]
  }

  if (tab === 'active') {
    return [
      ...base,
      {
        key: 'subscription',
        label: 'Subscription',
        render: (row: Record<string, unknown>) => {
          const sub = (row as unknown as Driver).driver_subscriptions?.[0]
          return sub ? <SubscriptionBadge status={sub.status} /> : <span className="text-gray-400 text-xs">None</span>
        },
      },
      {
        key: 'rating',
        label: 'Rating',
        render: (row: Record<string, unknown>) => {
          const r = (row as unknown as Driver).rating
          return <span className="text-gray-700">⭐ {r?.toFixed(1)}</span>
        },
      },
      {
        key: 'last_active_at',
        label: 'Last Active',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-500 text-xs">{timeAgo((row as unknown as Driver).last_active_at ?? undefined)}</span>
        ),
      },
    ]
  }

  if (tab === 'pending') {
    return [
      ...base,
      {
        key: 'documents',
        label: 'Documents',
        render: () => <Badge variant="yellow">Pending</Badge>,
      },
      {
        key: 'joined_at',
        label: 'Signup Date',
        render: (row: Record<string, unknown>) => formatDate((row as unknown as Driver).joined_at),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row: Record<string, unknown>) => <DriverStatusBadge status={(row as unknown as Driver).status} />,
      },
    ]
  }

  if (tab === 'suspended') {
    return [
      ...base,
      {
        key: 'suspended_reason',
        label: 'Reason',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-600 text-xs">{(row as unknown as Driver).suspended_reason ?? '—'}</span>
        ),
      },
      {
        key: 'suspended_at',
        label: 'Suspended On',
        render: (row: Record<string, unknown>) => formatDate((row as unknown as Driver).suspended_at ?? undefined),
      },
      {
        key: 'total_trips',
        label: 'Total Trips',
        render: (row: Record<string, unknown>) => (row as unknown as Driver).total_trips,
      },
      {
        key: 'complaints_count',
        label: 'Complaints',
        render: (row: Record<string, unknown>) => (
          <span className="text-red-600 font-medium">{(row as unknown as Driver).complaints_count}</span>
        ),
      },
    ]
  }

  if (tab === 'churned') {
    return [
      ...base,
      {
        key: 'last_active_at',
        label: 'Last Active',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-500 text-xs">{timeAgo((row as unknown as Driver).last_active_at ?? undefined)}</span>
        ),
      },
      {
        key: 'total_trips',
        label: 'Total Trips',
        render: (row: Record<string, unknown>) => (row as unknown as Driver).total_trips,
      },
      {
        key: 'churn_reason',
        label: 'Churn Reason',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-500 text-xs">{(row as unknown as Driver).churn_reason ?? 'Inactivity'}</span>
        ),
      },
    ]
  }

  return base
}
