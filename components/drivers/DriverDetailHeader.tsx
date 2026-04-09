'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { CallIcon, CancelCircleIcon, FlagIcon } from '@hugeicons/core-free-icons'
import { Modal } from '@/components/ui/Modal'
import type { Driver, AdminUser } from '@/lib/types'

export function DriverDetailHeader({ driver, adminUser }: { driver: Driver; adminUser: AdminUser }) {
  const router = useRouter()
  const [modal, setModal] = useState<'suspend' | 'flag' | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canWrite = ['super_admin', 'ops_admin'].includes(adminUser.role)

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
          <h1 className="text-2xl font-semibold text-[#1d242d] tracking-[-0.5px]">Drivers Details</h1>
        </div>

        {/* Right — action buttons */}
        {canWrite && (
          <div className="flex items-center gap-2 mt-1">
            <a
              href={`tel:${driver.phone}`}
              className="flex items-center gap-2 bg-[#2B39C7] text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-[#1f2d9e] transition-colors"
            >
              <HugeiconsIcon icon={CallIcon} size={16} color="white" strokeWidth={1.5} />
              Contacts Driver
            </a>

            {driver.status === 'active' && (
              <button
                onClick={() => setModal('suspend')}
                className="flex items-center gap-2 bg-red-500 text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-red-600 transition-colors"
              >
                <HugeiconsIcon icon={CancelCircleIcon} size={16} color="white" strokeWidth={1.5} />
                Suspend Driver
              </button>
            )}

            {driver.status === 'suspended' && (
              <button
                onClick={() => postAction('/api/drivers/reactivate', { driver_id: driver.id })}
                className="flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-green-700 transition-colors"
              >
                Reactivate Driver
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

      {/* Suspend modal */}
      <Modal
        open={modal === 'suspend'}
        onClose={() => { setModal(null); setReason('') }}
        title="Suspend Driver"
        footer={
          <>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
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
          <label className="block text-sm font-medium text-gray-700">Reason (required)</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Enter reason…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>

      {/* Flag modal */}
      <Modal
        open={modal === 'flag'}
        onClose={() => { setModal(null); setReason('') }}
        title="Flag Driver for Review"
        footer={
          <>
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              disabled={!reason.trim() || loading}
              onClick={() => postAction('/api/drivers/flag', { driver_id: driver.id, flag_reason: reason })}
              className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              {loading ? 'Flagging…' : 'Flag Driver'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Flag reason (required)</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Describe the concern…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>
    </>
  )
}
