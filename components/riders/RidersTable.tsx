'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { RiderStatusBadge } from '@/components/ui/Badge'
import { formatDate, timeAgoShort } from '@/lib/utils'
import type { Rider } from '@/lib/types'

interface Tab { key: string; label: string }

// ── Mock data (shown when DB is not yet seeded) ──────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MOCK_RIDERS: any[] = [
  { id: 'r1', rider_number: 'RDR-000001', full_name: 'Amina Salum',     phone: '0712 001 111', email: 'amina@email.com',  status: 'active',   total_rides: 142, completed_rides: 138, cancelled_rides: 4,  last_ride_at: new Date(Date.now() - 1  * 60_000).toISOString(),        registered_at: '2024-01-10T08:00:00Z', ban_reason: null },
  { id: 'r2', rider_number: 'RDR-000002', full_name: 'Brian Makundi',   phone: '0754 002 222', email: null,               status: 'active',   total_rides: 87,  completed_rides: 83,  cancelled_rides: 4,  last_ride_at: new Date(Date.now() - 30 * 60_000).toISOString(),       registered_at: '2024-02-14T10:30:00Z', ban_reason: null },
  { id: 'r3', rider_number: 'RDR-000003', full_name: 'Cynthia Omondi',  phone: '0765 003 333', email: 'cynthia@email.com', status: 'inactive', total_rides: 23,  completed_rides: 20,  cancelled_rides: 3,  last_ride_at: new Date(Date.now() - 45 * 86_400_000).toISOString(),   registered_at: '2024-03-05T14:00:00Z', ban_reason: null },
  { id: 'r4', rider_number: 'RDR-000004', full_name: 'Daniel Juma',     phone: '0789 004 444', email: 'daniel@email.com', status: 'active',   total_rides: 310, completed_rides: 298, cancelled_rides: 12, last_ride_at: new Date(Date.now() - 2  * 3600_000).toISOString(),      registered_at: '2023-11-20T09:00:00Z', ban_reason: null },
  { id: 'r5', rider_number: 'RDR-000005', full_name: 'Esther Kimani',   phone: '0798 005 555', email: 'esther@email.com', status: 'banned',   total_rides: 15,  completed_rides: 10,  cancelled_rides: 5,  last_ride_at: new Date(Date.now() - 60 * 86_400_000).toISOString(),   registered_at: '2024-04-01T11:00:00Z', ban_reason: 'Repeated misconduct reported by drivers' },
  { id: 'r6', rider_number: 'RDR-000006', full_name: 'Farida Hassan',   phone: '0800 006 666', email: null,               status: 'active',   total_rides: 208, completed_rides: 200, cancelled_rides: 8,  last_ride_at: new Date(Date.now() - 10 * 60_000).toISOString(),       registered_at: '2023-12-01T08:00:00Z', ban_reason: null },
  { id: 'r7', rider_number: 'RDR-000007', full_name: 'George Mwangi',   phone: '0822 007 777', email: 'george@email.com', status: 'inactive', total_rides: 41,  completed_rides: 38,  cancelled_rides: 3,  last_ride_at: new Date(Date.now() - 35 * 86_400_000).toISOString(),   registered_at: '2024-01-25T07:30:00Z', ban_reason: null },
  { id: 'r8', rider_number: 'RDR-000008', full_name: 'Halima Ngowi',    phone: '0843 008 888', email: 'halima@email.com', status: 'active',   total_rides: 512, completed_rides: 500, cancelled_rides: 12, last_ride_at: new Date(Date.now() - 5  * 60_000).toISOString(),        registered_at: '2023-09-15T06:00:00Z', ban_reason: null },
]

const CARD_TITLES: Record<string, string> = {
  all:      'All Riders',
  active:   'Active Riders',
  inactive: 'Inactive Riders',
  banned:   'Banned Riders',
}

// Mock filtered by tab so switching tabs works correctly in demo mode
const MOCK_BY_TAB: Record<string, typeof MOCK_RIDERS> = {
  all:      MOCK_RIDERS,
  active:   MOCK_RIDERS.filter(r => r.status === 'active'),
  inactive: MOCK_RIDERS.filter(r => r.status === 'inactive'),
  banned:   MOCK_RIDERS.filter(r => r.status === 'banned'),
}

export function RidersTable({
  riders, total, page, tab, tabs, search, useMock,
}: {
  riders: Rider[]
  total:  number
  page:   number
  tab:    string
  tabs:   Tab[]
  search?: string
  useMock?: boolean
}) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k) })
    router.push(`/riders?${params.toString()}`)
  }

  const mockForTab    = MOCK_BY_TAB[tab] ?? MOCK_RIDERS
  const displayRiders = useMock ? mockForTab as Rider[] : riders
  const displayTotal  = useMock ? mockForTab.length : total

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <DataTable
        columns={getColumns(tab)}
        data={displayRiders}
        cardTitle={CARD_TITLES[tab] ?? 'Riders'}
        searchValue={search ?? ''}
        onSearch={v => navigate({ search: v, page: '1' })}
        selectable
        rowActions={row => {
          const r = row as Rider
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const actions: any[] = [{ label: 'View Profile', onClick: () => router.push(`/riders/${r.id}`) }]
          if (r.status === 'active') {
            actions.push({ label: 'Mark Inactive', onClick: () => router.push(`/riders/${r.id}?action=deactivate`), danger: false })
            actions.push({ label: 'Ban Rider',     onClick: () => router.push(`/riders/${r.id}?action=ban`),        danger: true  })
          }
          if (r.status === 'inactive') {
            actions.push({ label: 'Reactivate', onClick: () => router.push(`/riders/${r.id}?action=reactivate`) })
            actions.push({ label: 'Ban Rider',  onClick: () => router.push(`/riders/${r.id}?action=ban`), danger: true })
          }
          if (r.status === 'banned') {
            actions.push({ label: 'Unban Rider', onClick: () => router.push(`/riders/${r.id}?action=unban`) })
          }
          return actions
        }}
        onRowClick={(row: Rider) => router.push(`/riders/${row.id}`)}
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
  // Base columns shared across all tabs
  const base = [
    {
      key: 'full_name',
      label: 'Rider Name',
      render: (row: Record<string, unknown>) => {
        const r = row as unknown as Rider
        return (
          <div>
            <p className="font-medium text-[#1d242d]">{r.full_name}</p>
            <p className="text-xs text-gray-400">{r.rider_number}</p>
          </div>
        )
      },
    },
    {
      key: 'phone',
      label: 'Phone Number',
      render: (row: Record<string, unknown>) => (
        <span className="text-gray-600">{(row as unknown as Rider).phone}</span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row: Record<string, unknown>) => {
        const email = (row as unknown as Rider).email
        return <span className="text-gray-500 text-sm">{email ?? '—'}</span>
      },
    },
  ]

  if (tab === 'all' || tab === 'active') {
    return [
      ...base,
      {
        key: 'total_rides',
        label: 'Total Rides',
        render: (row: Record<string, unknown>) => {
          const r = row as unknown as Rider
          return (
            <div>
              <p className="font-medium text-[#1d242d]">{r.total_rides.toLocaleString()}</p>
              <p className="text-xs text-gray-400">{r.completed_rides} completed</p>
            </div>
          )
        },
      },
      {
        key: 'last_ride_at',
        label: 'Last Ride',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-400 text-sm">
            {timeAgoShort((row as unknown as Rider).last_ride_at ?? undefined)}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row: Record<string, unknown>) => (
          <RiderStatusBadge status={(row as unknown as Rider).status} />
        ),
      },
      {
        key: 'registered_at',
        label: 'Joined',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-400 text-sm">
            {formatDate((row as unknown as Rider).registered_at)}
          </span>
        ),
      },
    ]
  }

  if (tab === 'inactive') {
    return [
      ...base,
      {
        key: 'total_rides',
        label: 'Total Rides',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-700">{((row as unknown as Rider).total_rides ?? 0).toLocaleString()}</span>
        ),
      },
      {
        key: 'last_ride_at',
        label: 'Last Ride',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-400 text-sm">
            {timeAgoShort((row as unknown as Rider).last_ride_at ?? undefined)}
          </span>
        ),
      },
      {
        key: 'registered_at',
        label: 'Joined',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-400 text-sm">
            {formatDate((row as unknown as Rider).registered_at)}
          </span>
        ),
      },
    ]
  }

  if (tab === 'banned') {
    return [
      ...base,
      {
        key: 'ban_reason',
        label: 'Ban Reason',
        render: (row: Record<string, unknown>) => (
          <span className="text-red-500 text-sm">
            {(row as unknown as Rider).ban_reason ?? '—'}
          </span>
        ),
      },
      {
        key: 'banned_at',
        label: 'Banned On',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-400 text-sm">
            {formatDate((row as unknown as Rider).banned_at ?? undefined)}
          </span>
        ),
      },
      {
        key: 'total_rides',
        label: 'Total Rides',
        render: (row: Record<string, unknown>) => (
          <span className="text-gray-700">{((row as unknown as Rider).total_rides ?? 0).toLocaleString()}</span>
        ),
      },
    ]
  }

  return base
}
