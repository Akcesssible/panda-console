'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Driver, AdminUser } from '@/lib/types'
import { Modal } from '@/components/ui/Modal'

export function DriverAdminActions({ driver, adminUser }: { driver: Driver; adminUser: AdminUser }) {
  const router = useRouter()
  const [modal, setModal] = useState<'suspend' | 'reject' | 'flag' | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canWrite = ['super_admin', 'ops_admin'].includes(adminUser.role)

  async function postAction(endpoint: string, body: Record<string, unknown>) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Action failed')
      }
      setModal(null)
      setReason('')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!canWrite) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Admin Actions</h2>
        <p className="text-xs text-gray-400">You do not have permission to take actions on drivers.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Admin Actions</h2>
        <div className="space-y-2">
          {driver.status === 'pending' && (
            <>
              <ActionButton
                label="Approve Driver"
                variant="green"
                onClick={() => postAction('/api/drivers/approve', { driver_id: driver.id })}
              />
              <ActionButton
                label="Reject Driver"
                variant="red"
                onClick={() => setModal('reject')}
              />
            </>
          )}

          {driver.status === 'active' && (
            <ActionButton
              label="Suspend Driver"
              variant="red"
              onClick={() => setModal('suspend')}
            />
          )}

          {driver.status === 'suspended' && (
            <ActionButton
              label="Reactivate Driver"
              variant="green"
              onClick={() => postAction('/api/drivers/reactivate', { driver_id: driver.id })}
            />
          )}

          <ActionButton
            label="Flag for Review"
            variant="yellow"
            onClick={() => setModal('flag')}
          />

          <a
            href={`tel:${driver.phone}`}
            className="block w-full text-center text-sm font-medium py-2 px-3 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Contact Driver
          </a>
        </div>
      </div>

      {/* Suspend Modal */}
      <Modal
        open={modal === 'suspend'}
        onClose={() => { setModal(null); setReason('') }}
        title="Suspend Driver"
        footer={
          <>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              disabled={!reason.trim() || loading}
              onClick={() => postAction('/api/drivers/suspend', { driver_id: driver.id, reason })}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Suspending...' : 'Suspend'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Suspending <strong>{driver.full_name}</strong> will immediately remove them from the active driver pool.
          </p>
          <label className="block text-sm font-medium text-gray-700">Reason (required)</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Enter reason for suspension..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={modal === 'reject'}
        onClose={() => { setModal(null); setReason('') }}
        title="Reject Driver Application"
        footer={
          <>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              disabled={!reason.trim() || loading}
              onClick={() => postAction('/api/drivers/reject', { driver_id: driver.id, reason })}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Rejecting...' : 'Reject Application'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Rejection reason (required)</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Enter rejection reason..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>

      {/* Flag Modal */}
      <Modal
        open={modal === 'flag'}
        onClose={() => { setModal(null); setReason('') }}
        title="Flag Driver for Review"
        footer={
          <>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              disabled={!reason.trim() || loading}
              onClick={() => postAction('/api/drivers/flag', { driver_id: driver.id, flag_reason: reason })}
              className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              {loading ? 'Flagging...' : 'Flag Driver'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Flag reason (required)</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Describe the concern..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>
    </>
  )
}

function ActionButton({
  label, variant, onClick,
}: { label: string; variant: 'green' | 'red' | 'yellow'; onClick: () => void }) {
  const styles = {
    green: 'bg-green-600 text-white hover:bg-green-700',
    red: 'bg-red-600 text-white hover:bg-red-700',
    yellow: 'bg-yellow-500 text-white hover:bg-yellow-600',
  }
  return (
    <button
      onClick={onClick}
      className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${styles[variant]}`}
    >
      {label}
    </button>
  )
}
