'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { TicketStatusBadge, Badge } from '@/components/ui/Badge'
import { timeAgoShort } from '@/lib/utils'
import type { SupportTicket } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  fare_dispute: 'Fare Dispute',
  driver_complaint: 'Driver Complaint',
  rider_complaint: 'Rider Complaint',
  technical: 'Technical',
  other: 'Other',
}

const CARD_TITLES: Record<string, string> = {
  open: 'Open Tickets',
  in_progress: 'In Progress',
  resolved: 'Resolved Tickets',
  all: 'All Tickets',
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_TICKETS = [
  { id: 'm1', ticket_number: 'TKT-00001', type: 'fare_dispute',       subject: 'Overcharged fare on airport trip',   status: 'open',        reporter_type: 'rider',  reported_by: 'Alice M.', created_at: new Date(Date.now() - 10*60_000).toISOString(),    admin_users: null },
  { id: 'm2', ticket_number: 'TKT-00002', type: 'driver_complaint',   subject: 'Driver was rude and unprofessional', status: 'in_progress', reporter_type: 'rider',  reported_by: 'Bob K.',   created_at: new Date(Date.now() - 2*3600_000).toISOString(),   admin_users: { full_name: 'Kevin M.' } },
  { id: 'm3', ticket_number: 'TKT-00003', type: 'technical',          subject: 'App crash during payment',            status: 'open',        reporter_type: 'driver', reported_by: 'John M.', created_at: new Date(Date.now() - 5*3600_000).toISOString(),   admin_users: null },
  { id: 'm4', ticket_number: 'TKT-00004', type: 'fare_dispute',       subject: 'Wrong route charged',                status: 'resolved',    reporter_type: 'rider',  reported_by: 'Sofia L.', created_at: new Date(Date.now() - 86400_000).toISOString(),    admin_users: { full_name: 'Kevin M.' } },
  { id: 'm5', ticket_number: 'TKT-00005', type: 'rider_complaint',    subject: 'Rider was no-show after booking',    status: 'open',        reporter_type: 'driver', reported_by: 'Ethan W.', created_at: new Date(Date.now() - 30*60_000).toISOString(),   admin_users: null },
]

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displayTickets: any[] = tickets.length > 0 ? tickets : MOCK_TICKETS
  const displayTotal = tickets.length > 0 ? total : MOCK_TICKETS.length

  const columns = [
    {
      key: 'ticket_number',
      label: 'Ticket',
      render: (row: Record<string, unknown>) => (
        <span className="font-mono font-semibold text-[#1d242d]">{(row as unknown as SupportTicket).ticket_number}</span>
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
        <span className="text-sm text-[#1d242d] max-w-64 truncate block">{(row as unknown as SupportTicket).subject}</span>
      ),
    },
    {
      key: 'reporter',
      label: 'Reported By',
      render: (row: Record<string, unknown>) => {
        const t = row as unknown as SupportTicket
        return (
          <div>
            <p className="font-medium text-[#1d242d]">{t.reported_by}</p>
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
        return t.admin_users
          ? <span className="text-sm text-[#1d242d]">{t.admin_users.full_name}</span>
          : <span className="text-gray-400 text-sm">Unassigned</span>
      },
    },
    {
      key: 'created_at',
      label: 'Opened',
      render: (row: Record<string, unknown>) => (
        <span className="text-gray-400 text-sm">{timeAgoShort((row as unknown as SupportTicket).created_at)}</span>
      ),
    },
  ]

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm">
      <DataTable
        columns={columns}
        data={displayTickets}
        cardTitle={CARD_TITLES[tab] ?? 'Support Tickets'}
        selectable
        rowActions={row => [
          { label: 'View Ticket', onClick: () => router.push(`/support/${(row as SupportTicket).id}`) },
          { label: 'Assign to Me', onClick: () => router.push(`/support/${(row as SupportTicket).id}?action=assign`) },
          { label: 'Resolve', onClick: () => router.push(`/support/${(row as SupportTicket).id}?action=resolve`) },
        ]}
        onRowClick={row => router.push(`/support/${(row as unknown as SupportTicket).id}`)}
      />
      <Pagination page={page} total={displayTotal} perPage={20} onPageChange={p => navigate({ page: String(p) })} />
    </div>
  )
}
