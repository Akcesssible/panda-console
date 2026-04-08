'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import type { AdminRole } from '@/lib/types'

export function FlagRideButton({ rideId, adminRole }: { rideId: string; adminRole: AdminRole }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const canFlag = ['super_admin', 'ops_admin'].includes(adminRole)
  if (!canFlag) return null

  async function handleFlag() {
    setLoading(true)
    await fetch(`/api/rides/${rideId}/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
      >
        Flag Ride
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Flag Ride"
        footer={
          <>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              disabled={!reason.trim() || loading}
              onClick={handleFlag}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Flagging...' : 'Flag Ride'}
            </button>
          </>
        }
      >
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="Reason for flagging..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </Modal>
    </>
  )
}
