'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { DriverStatusBadge, SubscriptionBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate, timeAgoShort } from '@/lib/utils'
import type { Driver } from '@/lib/types'

interface Tab { key: string; label: string }

// ── Mock data (shown when DB is not yet seeded) ───────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MOCK_DRIVERS: any[] = [
  { id: 'm1', full_name: 'John Mawella',    driver_number: 'DRV-000001', phone: '0712 345 678', status: 'active',    total_trips: 1284, last_active_at: new Date(Date.now() - 2*60_000).toISOString(),       vehicles: [{ vehicle_type: 'car' }],      driver_subscriptions: [{ status: 'active' }] },
  { id: 'm2', full_name: 'Asha Kassim',     driver_number: 'DRV-000002', phone: '0754 221 990', status: 'churned',   total_trips: 342,  last_active_at: new Date(Date.now() - 32*86_400_000).toISOString(),  vehicles: [{ vehicle_type: 'bajaj' }],    driver_subscriptions: [{ status: 'expired' }] },
  { id: 'm3', full_name: "Liam O'Connor",   driver_number: 'DRV-000003', phone: '0765 432 109', status: 'active',    total_trips: 2567, last_active_at: new Date(Date.now() - 5*60_000).toISOString(),        vehicles: [{ vehicle_type: 'car' }],      driver_subscriptions: [{ status: 'active' }] },
  { id: 'm4', full_name: 'Sofia Lee',       driver_number: 'DRV-000004', phone: '0789 654 321', status: 'active',    total_trips: 1256, last_active_at: new Date(Date.now() - 10*86_400_000).toISOString(),  vehicles: [{ vehicle_type: 'bajaj' }],    driver_subscriptions: [{ status: 'active' }] },
  { id: 'm5', full_name: 'Maya Patel',      driver_number: 'DRV-000005', phone: '0798 876 543', status: 'churned',   total_trips: 874,  last_active_at: new Date(Date.now() - 20*86_400_000).toISOString(),  vehicles: [{ vehicle_type: 'car' }],      driver_subscriptions: [{ status: 'expired' }] },
  { id: 'm6', full_name: 'Ethan Wright',    driver_number: 'DRV-000006', phone: '0800 123 456', status: 'active',    total_trips: 1789, last_active_at: new Date(Date.now() - 15*86_400_000).toISOString(),  vehicles: [{ vehicle_type: 'bodaboda' }], driver_subscriptions: [{ status: 'active' }] },
  { id: 'm7', full_name: 'Olivia Martinez', driver_number: 'DRV-000007', phone: '0822 345 678', status: 'active',    total_trips: 3456, last_active_at: new Date(Date.now() - 3*60_000).toISOString(),        vehicles: [{ vehicle_type: 'car' }],      driver_subscriptions: [{ status: 'active' }] },
  { id: 'm8', full_name: 'Noah Smith',      driver_number: 'DRV-000008', phone: '0843 987 654', status: 'churned',   total_trips: 912,  last_active_at: new Date(Date.now() - 25*86_400_000).toISOString(),  vehicles: [{ vehicle_type: 'bodaboda' }], driver_subscriptions: [{ status: 'expired' }] },
]

const CARD_TITLES: Record<string, string> = {
  all: 'Total Drivers',
  active: 'Active Drivers',
  pending: 'Pending Approval',
  suspended: 'Suspended Drivers',
  churned: 'Churned Drivers',
}

// Mock filtered by tab so switching tabs works correctly in demo mode
const MOCK_BY_TAB: Record<string, typeof MOCK_DRIVERS> = {
  all:       MOCK_DRIVERS,
  active:    MOCK_DRIVERS.filter(d => d.status === 'active'),
  pending:   MOCK_DRIVERS.filter(d => d.status === 'pending'),
  suspended: MOCK_DRIVERS.filter(d => d.status === 'suspended'),
  churned:   MOCK_DRIVERS.filter(d => d.status === 'churned'),
}

export function DriversTable({
  drivers, total, page, tab, tabs, search, useMock,
}: {
  drivers: Driver[]
  total: number
  page: number
  tab: string
  tabs: Tab[]
  search?: string
  useMock?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k) })
    router.push(`/drivers?${params.toString()}`)
  }

  const mockForTab     = MOCK_BY_TAB[tab] ?? MOCK_DRIVERS
  const displayDrivers = useMock ? mockForTab as Driver[] : drivers
  const displayTotal   = useMock ? mockForTab.length : total

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
          if (d.status === 'active') {
            actions.push({ label: 'Suspend', onClick: () => router.push(`/drivers/${d.id}?action=suspend`), danger: true })
            actions.push({ label: 'Flag', onClick: () => router.push(`/drivers/${d.id}?action=flag`), danger: true })
          }
          if (d.status === 'suspended') {
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
