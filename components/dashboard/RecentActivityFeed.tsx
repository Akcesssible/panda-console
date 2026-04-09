'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils'
import type { AuditLog } from '@/lib/types'
import Link from 'next/link'

const ACTION_LABELS: Record<string, { label: string; type: string }> = {
  'driver.approve': { label: 'Driver approved', type: 'Driver' },
  'driver.reject': { label: 'Driver rejected', type: 'Driver' },
  'driver.suspend': { label: 'Driver suspended', type: 'Driver' },
  'driver.reactivate': { label: 'Driver reactivated', type: 'Driver' },
  'driver.flag': { label: 'Driver flagged', type: 'Driver' },
  'subscription.assign': { label: 'Subscription assigned', type: 'Subscription' },
  'subscription.revoke': { label: 'Subscription revoked', type: 'Subscription' },
  'subscription.extend': { label: 'Subscription extended', type: 'Subscription' },
  'pricing.rule.create': { label: 'Pricing rule created', type: 'Pricing' },
  'pricing.rule.deactivate': { label: 'Pricing rule deactivated', type: 'Pricing' },
  'support.ticket.resolve': { label: 'Ticket resolved', type: 'Support' },
  'support.fare.adjust': { label: 'Fare adjusted', type: 'Support' },
  'support.refund.issue': { label: 'Refund issued', type: 'Support' },
}

export function RecentActivityFeed({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs)

  // Subscribe to new audit log entries via Realtime
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('audit-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload: { new: unknown }) => {
        setLogs(prev => [payload.new as AuditLog, ...prev].slice(0, 20))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="divide-y divide-gray-100">
      <div className="px-5 py-3 grid grid-cols-5 gap-4 text-xs font-medium text-gray-400 uppercase tracking-wide">
        <span className="col-span-2">Event</span>
        <span>Type</span>
        <span>Admin</span>
        <span>Time</span>
      </div>
      {logs.slice(0, 20).map(log => {
        const meta = ACTION_LABELS[log.action]
        return (
          <div key={log.id} className="px-5 py-3 grid grid-cols-5 gap-4 text-sm hover:bg-gray-50">
            <span className="col-span-2 text-gray-700">{meta?.label ?? log.action}</span>
            <span className="text-gray-500">{meta?.type ?? log.entity_type}</span>
            <span className="text-gray-500 truncate">{log.admin_email.split('@')[0]}</span>
            <span className="text-gray-400 text-xs">{timeAgo(log.created_at)}</span>
          </div>
        )
      })}
    </div>
  )
}
