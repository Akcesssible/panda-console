'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { RiderStatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate, timeAgoShort } from '@/lib/utils'
import type { Rider } from '@/lib/types'

interface Tab { key: string; label: string }

const CARD_TITLES: Record<string, string> = {
  all:      'All Riders',
  active:   'Active Riders',
  inactive: 'Inactive Riders',
  banned:   'Banned Riders',
}

export function RidersTable({
  riders, total, page, tab, tabs, search,
}: {
  riders: Rider[]
  total:  number
  page:   number
  tab:    string
  tabs:   Tab[]
  search?: string
}) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k) })
    router.push(`/riders?${params.toString()}`)
  }

  const displayRiders = riders
  const displayTotal  = total

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
          <div className="flex items-center gap-3">
            <Avatar id={r.id} name={r.full_name} size="md" />
            <div className="min-w-0">
              <p className="font-medium text-[#1d242d]">{r.full_name}</p>
              <p className="text-xs text-gray-400">{r.rider_number}</p>
            </div>
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
