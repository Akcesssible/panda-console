'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils'
import type { AuditLog } from '@/lib/types'

const ACTION_META: Record<string, { label: string; type: string; status: string; statusColor: string }> = {
  'driver.approve':           { label: 'New driver approved',     type: 'Driver',       status: 'Success',   statusColor: 'bg-green-500' },
  'driver.reject':            { label: 'Driver rejected',         type: 'Driver',       status: 'Rejected',  statusColor: 'bg-red-500' },
  'driver.suspend':           { label: 'Driver suspended',        type: 'Driver',       status: 'Suspended', statusColor: 'bg-red-500' },
  'driver.reactivate':        { label: 'Driver reactivated',      type: 'Driver',       status: 'Success',   statusColor: 'bg-green-500' },
  'driver.flag':              { label: 'Driver flagged',          type: 'Driver',       status: 'Pending',   statusColor: 'bg-yellow-500' },
  'subscription.assign':      { label: 'Subscription activated',  type: 'Subscription', status: 'Success',   statusColor: 'bg-green-500' },
  'subscription.revoke':      { label: 'Subscription revoked',    type: 'Subscription', status: 'Expired',   statusColor: 'bg-red-500' },
  'pricing.rule.create':      { label: 'Pricing rule created',    type: 'Pricing',      status: 'Success',   statusColor: 'bg-green-500' },
  'pricing.rule.deactivate':  { label: 'Pricing rule deactivated',type: 'Pricing',      status: 'Inactive',  statusColor: 'bg-gray-400' },
  'support.ticket.resolve':   { label: 'Ticket resolved',         type: 'Support',      status: 'Resolved',  statusColor: 'bg-green-500' },
  'support.fare.adjust':      { label: 'Fare adjusted',           type: 'Support',      status: 'Completed', statusColor: 'bg-green-500' },
  'ride.flag':                { label: 'Ride flagged',            type: 'Ride',         status: 'Flagged',   statusColor: 'bg-orange-500' },
}

function getReference(log: AuditLog): string {
  const name = log.metadata?.driver_name ?? log.metadata?.name ?? log.admin_email.split('@')[0]
  const type = log.entity_type.charAt(0).toUpperCase() + log.entity_type.slice(1)
  return `${name} → ${type}`
}

export function RecentActivityTable({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('audit-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, payload => {
        setLogs(prev => [payload.new as AuditLog, ...prev].slice(0, 20))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = logs.filter(log => {
    if (!search) return true
    const meta = ACTION_META[log.action]
    const label = meta?.label ?? log.action
    return label.toLowerCase().includes(search.toLowerCase()) ||
      (meta?.type ?? log.entity_type).toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="bg-white rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-[#1d242d]">Recent Activity</span>
          <svg className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2B39C7] w-48"
            />
          </div>
          <button className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
            </svg>
            Filter
          </button>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-5 px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-100">
        <span className="col-span-2">Event</span>
        <span>Type</span>
        <span>Status</span>
        <span>Time</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-sm text-gray-400 text-center">No activity yet</div>
        ) : (
          filtered.slice(0, 20).map(log => {
            const meta = ACTION_META[log.action]
            return (
              <div key={log.id} className="grid grid-cols-5 px-5 py-3 text-sm hover:bg-gray-50 items-center">
                <span className="col-span-2 text-[#1d242d]">{meta?.label ?? log.action}</span>
                <span className="text-gray-400">{meta?.type ?? log.entity_type}</span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${meta?.statusColor ?? 'bg-gray-400'}`} />
                  <span className="text-gray-500">{meta?.status ?? 'Done'}</span>
                </span>
                <span className="text-gray-400 text-xs">{timeAgo(log.created_at)}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
