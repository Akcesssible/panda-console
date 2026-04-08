'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs } from '@/components/ui/Tabs'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { TicketStatusBadge, Badge } from '@/components/ui/Badge'
import { timeAgo } from '@/lib/utils'
import type { SupportTicket } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  fare_dispute: 'Fare Dispute',
  driver_complaint: 'Driver Complaint',
  rider_complaint: 'Rider Complaint',
  technical: 'Technical',
  other: 'Other',
}

export function SupportTable({ tickets, total, page, tab, tabs }: {
  tickets: SupportTicket[]
  total: number
  page: number
  tab: string
  tabs: Array<{ key: string; label: string }>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k) })
    router.push(`/support?${params.toString()}`)
  }

  const columns = [
    {
      key: 'ticket_number',
      label: 'Ticket',
      render: (row: Record<string, unknown>) => (
        <span className="font-mono text-sm font-medium">{(row as unknown as SupportTicket).ticket_number}</span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row: Record<string, unknown>) => (
        <Badge variant="blue">{TYPE_LABELS[(row as unknown as SupportTicket).type] ?? (row as unknown as SupportTicket).type}</Badge>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (row: Record<string, unknown>) => (
        <span className="text-sm text-gray-700 max-w-64 truncate block">{(row as unknown as SupportTicket).subject}</span>
      ),
    },
    {
      key: 'reporter',
      label: 'Reported By',
      render: (row: Record<string, unknown>) => {
        const t = row as unknown as SupportTicket
        return (
          <div>
            <p className="text-sm text-gray-700">{t.reported_by}</p>
            <p className="text-xs text-gray-400 capitalize">{t.reporter_type}</p>
          </div>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Record<string, unknown>) => <TicketStatusBadge status={(row as unknown as SupportTicket).status} />,
    },
    {
      key: 'assigned_to',
      label: 'Assigned',
      render: (row: Record<string, unknown>) => {
        const t = row as unknown as SupportTicket & { admin_users?: { full_name: string } }
        return t.admin_users ? (
          <span className="text-sm text-gray-600">{t.admin_users.full_name}</span>
        ) : <span className="text-gray-400 text-xs">Unassigned</span>
      },
    },
    {
      key: 'created_at',
      label: 'Opened',
      render: (row: Record<string, unknown>) => (
        <span className="text-xs text-gray-400">{timeAgo((row as unknown as SupportTicket).created_at)}</span>
      ),
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 pt-4">
        <Tabs tabs={tabs} active={tab} onChange={key => navigate({ tab: key, page: '1' })} />
      </div>
      <DataTable
        columns={columns}
        data={tickets}
        onRowClick={row => router.push(`/support/${(row as unknown as SupportTicket).id}`)}
      />
      <Pagination page={page} total={total} perPage={20} onPageChange={p => navigate({ page: String(p) })} />
    </div>
  )
}
