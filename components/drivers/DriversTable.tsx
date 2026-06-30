'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { DriverStatusBadge, SubscriptionBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate, timeAgoShort } from '@/lib/utils'
import type { Driver } from '@/lib/types'

interface Tab { key: string; label: string }

const CARD_TITLES: Record<string, string> = {
  all: 'Total Drivers',
  active: 'Active Drivers',
  pending: 'Pending Approval',
  inactive: 'Inactive Drivers',
  banned: 'Banned Drivers',
  suspended: 'Suspended Drivers',
  churned: 'Rejected Drivers',
}

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

  const displayDrivers = drivers
  const displayTotal   = total

  const columns = getColumns(tab)

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <DataTable
        columns={columns}
        data={displayDrivers}
        cardTitle={CARD_TITLES[tab] ?? 'Drivers'}
        searchValue={search ?? ''}
        onSearch={v => navigate({ search: v, page: '1' })}
        selectable
        rowActions={row => {
          const d = row as Driver
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const actions: any[] = [{ label: 'View Profile', onClick: () => router.push(`/drivers/${d.id}`) }]
          if (d.status === 'pending') {
            actions.push({ label: 'Approve', onClick: () => router.push(`/drivers/${d.id}?action=approve`) })
            actions.push({ label: 'Reject', onClick: () => router.push(`/drivers/${d.id}?action=reject`), danger: true })
          }
          if (d.status === 'active' || d.status === 'inactive') {
            actions.push({ label: 'Ban', onClick: () => router.push(`/drivers/${d.id}?action=ban`), danger: true })
            actions.push({ label: 'Suspend', onClick: () => router.push(`/drivers/${d.id}?action=suspend`), danger: true })
            actions.push({ label: 'Flag', onClick: () => router.push(`/drivers/${d.id}?action=flag`), danger: true })
          }
          if (d.status === 'suspended' || d.status === 'banned') {
            actions.push({ label: 'Reactivate', onClick: () => router.push(`/drivers/${d.id}?action=reactivate`) })
          }
          return actions
        }}
        onRowClick={(row: Driver) => router.push(`/drivers/${row.id}`)}
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

// ── Column definitions per tab ────────────────────────────────────────────────
function getColumns(tab: string) {
  const base = [
    {
      key: 'full_name',
      label: 'Driver Name',
      render: (row: Record<string, unknown>) => {
        const d = row as unknown as Driver
        return (
          <div className="flex items-center gap-3">
            <Avatar id={d.id} name={d.full_name} size="md" />
            <div className="min-w-0">
              <p className="font-medium text-[#1d242d]">{d.full_name}</p>
              <p className="text-xs text-gray-400">{d.driver_number}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'phone',
      label: 'Phone Number',
      render: (row: Record<string, unknown>) => (
        <span className="text-gray-600">{(row as unknown as Driver).phone}</span>
      ),
    },
    {
      key: 'vehicle_type',
      label: 'Vehicle Type',
      render: (row: Record<string, unknown>) => {
        const d = row as unknown as Driver
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const v = (d as any).vehicles?.[0]
        if (!v) return <span className="text-gray-400">—</span>
        const labels: Record<string, string> = { car: 'Car', bajaj: 'Bajaj', bodaboda: 'Boda' }
        return <span className="font-semibold text-[#1d242d]">{labels[v.vehicle_type] ?? v.vehicle_type}</span>
      },
    },
  ]

  if (tab === 'all' || tab === 'active') {
    return [
      ...base,
      {
        key: 'subscription',
        label: 'Subscription',
        render: (row: Record<string, unknown>) => {
          const d = row as unknown as Driver
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sub = (d as any).driver_subscriptions?.[0]
          if (!sub) return <span className="text-gray-400 text-sm">None</span>
          return <SubscriptionBadge status={sub.status} />
        },
      },
      {
        key: 'total_trips',
        label: 'Total Trips',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-700">{((row as unknown as Driver).total_trips ?? 0).toLocaleString()}</span>
        ),
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
          <span className="text-gray-400 text-sm">{timeAgoShort((row as unknown as Driver).last_active_at ?? undefined)}</span>
        ),
      },
    ]
  }

  if (tab === 'pending') {
    return [
      ...base,
      {
        key: 'joined_at',
        label: 'Signup Date',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-600">{formatDate((row as unknown as Driver).joined_at)}</span>
        ),
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
          <span className="text-gray-600 text-sm">{(row as unknown as Driver).suspended_reason ?? '—'}</span>
        ),
      },
      {
        key: 'suspended_at',
        label: 'Suspended On',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-600">{formatDate((row as unknown as Driver).suspended_at ?? undefined)}</span>
        ),
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

  if (tab === 'inactive') {
    return [
      ...base,
      {
        key: 'total_trips',
        label: 'Total Trips',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-700">{((row as unknown as Driver).total_trips ?? 0).toLocaleString()}</span>
        ),
      },
      {
        key: 'last_active_at',
        label: 'Last Active',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-400 text-sm">{timeAgoShort((row as unknown as Driver).last_active_at ?? undefined)}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row: Record<string, unknown>) => <DriverStatusBadge status={(row as unknown as Driver).status} />,
      },
    ]
  }

  if (tab === 'banned') {
    return [
      ...base,
      {
        key: 'banned_reason',
        label: 'Ban Reason',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-600 text-sm">{(row as unknown as Driver).banned_reason ?? '—'}</span>
        ),
      },
      {
        key: 'banned_at',
        label: 'Banned On',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-600">{formatDate((row as unknown as Driver).banned_at ?? undefined)}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row: Record<string, unknown>) => <DriverStatusBadge status={(row as unknown as Driver).status} />,
      },
    ]
  }

  if (tab === 'churned') {
    return [
      ...base,
      {
        key: 'total_trips',
        label: 'Total Trips',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-700">{((row as unknown as Driver).total_trips ?? 0).toLocaleString()}</span>
        ),
      },
      {
        key: 'last_active_at',
        label: 'Last Active',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-400 text-sm">{timeAgoShort((row as unknown as Driver).last_active_at ?? undefined)}</span>
        ),
      },
      {
        key: 'churn_reason',
        label: 'Churn Reason',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-500 text-sm">{(row as unknown as Driver).churn_reason ?? 'Inactivity'}</span>
        ),
      },
    ]
  }

  return base
}
