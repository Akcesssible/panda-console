'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import type { SupportTicket, AdminUser, ResolutionAction } from '@/lib/types'

const RESOLUTION_OPTIONS: { value: ResolutionAction; label: string }[] = [
  { value: 'fare_adjusted', label: 'Adjust Fare' },
  { value: 'refund_issued', label: 'Issue Refund' },
  { value: 'driver_warned', label: 'Warn Driver' },
  { value: 'driver_suspended', label: 'Suspend Driver' },
  { value: 'closed_no_action', label: 'Close (No Action)' },
]

export function TicketActions({ ticket, adminUser }: { ticket: SupportTicket; adminUser: AdminUser }) {
  const router = useRouter()
  const [resolveModal, setResolveModal] = useState(false)
  const [action, setAction] = useState<ResolutionAction>('closed_no_action')
  const [note, setNote] = useState('')
  const [fareAmount, setFareAmount] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const canAct = ['super_admin', 'ops_admin', 'support_agent'].includes(adminUser.role)
  const isResolved = ['resolved', 'closed'].includes(ticket.status)

  async function assignToSelf() {
    await fetch(`/api/support/tickets/${ticket.id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_id: adminUser.id }),
    })
    router.refresh()
  }

  async function handleResolve() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          note,
          fare_adjusted: fareAmount ? Number(fareAmount) : undefined,
          refund_amount: refundAmount ? Number(refundAmount) : undefined,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Something went wrong. Please try again.')
        return
      }
      setResolveModal(false)
      router.refresh()
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!canAct) return null

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Admin Actions</h3>
        <div className="space-y-2">
          {!ticket.assigned_to && !isResolved && (
            <button
              onClick={assignToSelf}
              className="w-full py-2 text-sm font-medium bg-primary$ text-white rounded-lg hover:bg-primary-dark$"
            >
              Assign to Me
            </button>
          )}
          {!isResolved && (
            <button
              onClick={() => setResolveModal(true)}
              className="w-full py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Resolve Ticket
            </button>
          )}
          {isResolved && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500">Ticket resolved</p>
              {ticket.resolution_action && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Action: {ticket.resolution_action.replace(/_/g, ' ')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={resolveModal}
        onClose={() => { setResolveModal(false); setError(null) }}
        title="Resolve Ticket"
        footer={
          <>
            <button onClick={() => { setResolveModal(false); setError(null) }} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              disabled={loading}
              onClick={handleResolve}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Action</label>
            <select
              value={action}
              onChange={e => setAction(e.target.value as ResolutionAction)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {RESOLUTION_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {action === 'fare_adjusted' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adjusted Fare (TZS)</label>
              <input
                value={fareAmount}
                onChange={e => setFareAmount(e.target.value)}
                placeholder="New total fare"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          {action === 'refund_issued' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount (TZS)</label>
              <input
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                placeholder="Amount to refund"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Note</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Describe the resolution..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      </Modal>
    </>
  )
}
