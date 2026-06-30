'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { CallIcon, CancelCircleIcon, FlagIcon, Tick02Icon, Cancel01Icon } from '@hugeicons-pro/core-stroke-rounded'
import { Modal } from '@/components/ui/Modal'
import type { Driver, AdminUser } from '@/lib/types'

export function DriverDetailHeader({ driver, adminUser }: { driver: Driver; adminUser: AdminUser }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [modal, setModal] = useState<'approve' | 'reject' | 'suspend' | 'flag' | 'ban' | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canWrite = ['super_admin', 'ops_admin'].includes(adminUser.role)

  // Auto-open the modal when the table row shortcuts (?action=...) navigate here
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'reactivate') {
      void postAction('/api/drivers/reactivate', { driver_id: driver.id })
      const url = new URL(window.location.href)
      url.searchParams.delete('action')
      window.history.replaceState({}, '', url.toString())
      return
    }

    if (action && ['approve', 'reject', 'suspend', 'flag', 'ban'].includes(action)) {
      setModal(action as Exclude<typeof modal, null>)
      // Remove the query param so a refresh doesn't re-trigger
      const url = new URL(window.location.href)
      url.searchParams.delete('action')
      window.history.replaceState({}, '', url.toString())
    }
    // `postAction` intentionally stays out of deps to avoid re-triggering when
    // local modal/loading state changes while the action query param is present.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver.id, searchParams])

  async function postAction(endpoint: string, body: Record<string, unknown>) {
    setLoading(true); setError('')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Action failed') }
      setModal(null); setReason(''); router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  function closeModal() { setModal(null); setReason(''); setError('') }

  return (
    <>
      <div className="flex items-start justify-between">
        {/* Left — breadcrumb + title */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/drivers" className="hover:text-[#1d242d] transition-colors">Drivers</Link>
            <span>›</span>
            <span className="text-[#1d242d]">Driver Details</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1d242d] tracking-[-0.5px]">
            {driver.status === 'pending' ? 'Application Review' : 'Driver Details'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {driver.status === 'inactive'
              ? 'This driver has been offline for at least 30 days and is currently marked inactive.'
              : driver.status === 'banned'
                ? 'This driver is banned and removed from the active driver pool.'
                : 'Review all associated identity, vehicle, document, and activity data from one place.'}
          </p>
        </div>

        {/* Right — action buttons */}
        {canWrite && (
          <div className="flex items-center gap-2 mt-1">
            <a
              href={`tel:${driver.phone}`}
              className="flex items-center gap-2 bg-[#2B39C7] text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-[#1f2d9e] transition-colors"
            >
              <HugeiconsIcon icon={CallIcon} size={16} color="white" strokeWidth={1.5} />
              Contact Driver
            </a>

            {/* Pending — approve + reject */}
            {driver.status === 'pending' && (
              <>
                <button
                  onClick={() => setModal('approve')}
                  className="flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-green-700 transition-colors"
                >
                  <HugeiconsIcon icon={Tick02Icon} size={16} color="white" strokeWidth={1.5} />
                  Approve Application
                </button>
                <button
                  onClick={() => setModal('reject')}
                  className="flex items-center gap-2 bg-red-500 text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-red-600 transition-colors"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} color="white" strokeWidth={1.5} />
                  Reject Application
                </button>
              </>
            )}

            {/* Active — suspend */}
            {(driver.status === 'active' || driver.status === 'inactive') && (
              <>
                <button
                  onClick={() => setModal('ban')}
                  className="flex items-center gap-2 bg-red-600 text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-red-700 transition-colors"
                >
                  <HugeiconsIcon icon={CancelCircleIcon} size={16} color="white" strokeWidth={1.5} />
                  Ban Driver
                </button>
                <button
                  onClick={() => setModal('suspend')}
                  className="flex items-center gap-2 border border-red-200 bg-white text-red-600 text-sm font-medium px-4 py-2.5 rounded-full hover:bg-red-50 transition-colors"
                >
                  <HugeiconsIcon icon={CancelCircleIcon} size={16} color="#dc2626" strokeWidth={1.5} />
                  Suspend Driver
                </button>
              </>
            )}

            {/* Suspended / banned — reactivate */}
            {(driver.status === 'suspended' || driver.status === 'banned') && (
              <button
                onClick={() => postAction('/api/drivers/reactivate', { driver_id: driver.id })}
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {loading ? 'Reactivating…' : 'Reactivate Driver'}
              </button>
            )}

            <button
              onClick={() => setModal('flag')}
              className="flex items-center gap-2 border border-gray-200 bg-white text-[#1d242d] text-sm font-medium px-4 py-2.5 rounded-full hover:bg-gray-50 transition-colors"
            >
              <HugeiconsIcon icon={FlagIcon} size={16} color="#1d242d" strokeWidth={1.5} />
              Flag
            </button>
          </div>
        )}
      </div>

      {/* ── Approve modal ── */}
      <Modal
        open={modal === 'approve'}
        onClose={closeModal}
        title="Approve Driver Application"
        footer={
          <>
            <button onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              disabled={loading}
              onClick={() => postAction('/api/drivers/approve', { driver_id: driver.id })}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Approving…' : 'Approve Driver'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            You are about to approve <strong>{driver.full_name}</strong>&apos;s application.
            They will be added to the active driver pool and notified.
          </p>
          <p className="text-sm text-gray-500">Please confirm that you have reviewed:</p>
          <ul className="text-sm text-gray-600 space-y-1 list-none">
            {[
              'National ID / identity document',
              'Driving license',
              'Vehicle photos and registration',
              'Vehicle ownership documents',
            ].map(item => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-green-500 flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>

      {/* ── Reject modal ── */}
      <Modal
        open={modal === 'reject'}
        onClose={closeModal}
        title="Reject Driver Application"
        footer={
          <>
            <button onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              disabled={!reason.trim() || loading}
              onClick={() => postAction('/api/drivers/reject', { driver_id: driver.id, reason })}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Rejecting…' : 'Reject Application'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Rejecting <strong>{driver.full_name}</strong>&apos;s application will notify them of the decision.
            Provide a clear reason so they can address the issue and reapply.
          </p>
          <label className="block text-sm font-medium text-gray-700">Rejection reason <span className="text-red-500">*</span></label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Blurry document photos — please resubmit with clearer images"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>

      {/* ── Suspend modal ── */}
      <Modal
        open={modal === 'suspend'}
        onClose={closeModal}
        title="Suspend Driver"
        footer={
          <>
            <button onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              disabled={!reason.trim() || loading}
              onClick={() => postAction('/api/drivers/suspend', { driver_id: driver.id, reason })}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Suspending…' : 'Suspend'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Suspending <strong>{driver.full_name}</strong> will immediately remove them from the active pool.</p>
          <label className="block text-sm font-medium text-gray-700">Reason <span className="text-red-500">*</span></label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Enter reason for suspension…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>

      {/* ── Ban modal ── */}
      <Modal
        open={modal === 'ban'}
        onClose={closeModal}
        title="Ban Driver"
        footer={
          <>
            <button onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              disabled={!reason.trim() || loading}
              onClick={() => postAction('/api/drivers/ban', { driver_id: driver.id, reason })}
              className="px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50"
            >
              {loading ? 'Banning…' : 'Ban Driver'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Banning <strong>{driver.full_name}</strong> removes them from the active driver pool and marks them as banned in the console.
          </p>
          <label className="block text-sm font-medium text-gray-700">Ban reason <span className="text-red-500">*</span></label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Describe why this driver is being banned…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>

      {/* ── Flag modal ── */}
      <Modal
        open={modal === 'flag'}
        onClose={closeModal}
        title="Flag Driver for Review"
        footer={
          <>
            <button onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              disabled={!reason.trim() || loading}
              onClick={() => postAction('/api/drivers/flag', { driver_id: driver.id, reason })}
              className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              {loading ? 'Flagging…' : 'Flag Driver'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Flag reason <span className="text-red-500">*</span></label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Describe the concern…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>
    </>
  )
}
