import { getTicketById } from '@/lib/queries/support'
import { getAdminUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TicketStatusBadge, Badge } from '@/components/ui/Badge'
import { formatDateTime, formatTZS } from '@/lib/utils'
import { TicketActions } from '@/components/support/TicketActions'
import { TicketConversation } from '@/components/support/TicketConversation'
import type { SupportTicket } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  fare_dispute: 'Fare Dispute', driver_complaint: 'Driver Complaint',
  rider_complaint: 'Rider Complaint', technical: 'Technical', other: 'Other',
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [adminUser, result] = await Promise.all([
    getAdminUser(),
    getTicketById(id).catch(() => null),
  ])

  if (!result) notFound()
  const { ticket, messages } = result

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/support" className="hover:text-gray-900">Support</Link>
        <span>/</span>
        <span className="text-gray-900">{ticket.ticket_number}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-lg font-semibold text-gray-900">{ticket.subject}</h1>
              <TicketStatusBadge status={ticket.status} />
              <Badge variant="blue">{TYPE_LABELS[ticket.type] ?? ticket.type}</Badge>
            </div>
            <p className="text-sm text-gray-500">{ticket.ticket_number} · Opened {formatDateTime(ticket.created_at)}</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mt-3 p-3 bg-gray-50 rounded-lg">{ticket.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation */}
        <div className="lg:col-span-2 space-y-6">
          <TicketConversation messages={messages} ticketId={ticket.id} adminUser={adminUser} />
        </div>

        {/* Details + Actions */}
        <div className="space-y-4">
          {/* Reporter */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Reported By</h3>
            <p className="text-sm font-medium text-gray-900">{ticket.reported_by}</p>
            <p className="text-xs text-gray-500 capitalize">{ticket.reporter_type}</p>
          </div>

          {/* Linked Driver */}
          {ticket.drivers && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Linked Driver</h3>
              <Link href={`/drivers/${ticket.driver_id}`} className="text-sm font-medium text-blue-600 hover:underline">
                {(ticket.drivers as { full_name: string }).full_name}
              </Link>
              <p className="text-xs text-gray-500">{(ticket.drivers as { phone: string }).phone}</p>
            </div>
          )}

          {/* Linked Ride */}
          {ticket.rides && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Related Ride</h3>
              <Link href={`/rides/${ticket.ride_id}`} className="text-sm font-medium text-blue-600 hover:underline">
                {(ticket.rides as { ride_number: string }).ride_number}
              </Link>
              {(ticket.rides as { total_fare_tzs: number }).total_fare_tzs && (
                <p className="text-xs text-gray-500">
                  Fare: {formatTZS((ticket.rides as { total_fare_tzs: number }).total_fare_tzs)}
                </p>
              )}
            </div>
          )}

          {/* Admin Actions */}
          <TicketActions ticket={ticket} adminUser={adminUser} />
        </div>
      </div>
    </div>
  )
}
