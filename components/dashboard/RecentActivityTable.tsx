'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { timeAgoShort } from '@/lib/utils'
import type { AuditLog } from '@/lib/types'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons-pro/core-stroke-rounded'
import { SearchBar } from '@/components/ui/SearchBar'
import { FilterButton } from '@/components/ui/FilterButton'
import { Badge } from '@/components/ui/Badge'
import type { BadgeVariant } from '@/components/ui/Badge'

// ── Action metadata ──────────────────────────────────────────────────────────
const ACTION_META: Record<string, {
  label: string
  type: string
  status: string
  statusVariant: BadgeVariant
  refLabel: string
  refHref: (id: string | null) => string
}> = {
  //  action                    label                          type           status        variant    refLabel           refHref
  'driver.approve':           { label: 'New driver approved',      type: 'Driver',       status: 'success',   statusVariant: 'green',  refLabel: 'Driver Profile', refHref: id => `/drivers/${id}` },
  'driver.reject':            { label: 'Driver rejected',          type: 'Driver',       status: 'rejected',  statusVariant: 'red',    refLabel: 'Driver Profile', refHref: id => `/drivers/${id}` },
  'driver.suspend':           { label: 'Driver suspended',         type: 'Driver',       status: 'suspended', statusVariant: 'red',    refLabel: 'Driver Profile', refHref: id => `/drivers/${id}` },
  'driver.reactivate':        { label: 'Driver reactivated',       type: 'Driver',       status: 'success',   statusVariant: 'green',  refLabel: 'Driver Profile', refHref: id => `/drivers/${id}` },
  'driver.flag':              { label: 'Driver flagged',           type: 'Driver',       status: 'flagged',   statusVariant: 'orange', refLabel: 'Driver Profile', refHref: id => `/drivers/${id}` },
  'driver.signup':            { label: 'New driver signed up',     type: 'Driver',       status: 'pending',   statusVariant: 'yellow', refLabel: 'Driver Profile', refHref: id => `/drivers/${id}` },
  'subscription.assign':      { label: 'Subscription activated',   type: 'Subscription', status: 'active',    statusVariant: 'green',  refLabel: 'Subscription',   refHref: () => '/subscriptions' },
  'subscription.revoke':      { label: 'Subscription revoked',     type: 'Subscription', status: 'expired',   statusVariant: 'red',    refLabel: 'Subscription',   refHref: () => '/subscriptions' },
  'subscription.expire':      { label: 'Subscription expired',     type: 'Subscription', status: 'expired',   statusVariant: 'red',    refLabel: 'Subscription',   refHref: () => '/subscriptions' },
  'pricing.rule.create':      { label: 'Pricing rule created',     type: 'Pricing',      status: 'active',    statusVariant: 'green',  refLabel: 'Pricing Rule',   refHref: () => '/pricing' },
  'pricing.rule.deactivate':  { label: 'Pricing rule deactivated', type: 'Pricing',      status: 'inactive',  statusVariant: 'gray',   refLabel: 'Pricing Rule',   refHref: () => '/pricing' },
  'support.ticket.resolve':   { label: 'Ticket resolved',          type: 'Support',      status: 'resolved',  statusVariant: 'green',  refLabel: 'Support Ticket', refHref: id => `/support/${id}` },
  'support.ticket.open':      { label: 'Fare dispute opened',      type: 'Support',      status: 'open',      statusVariant: 'red',    refLabel: 'Dispute',        refHref: id => `/support/${id}` },
  'support.fare.adjust':      { label: 'Fare adjusted',            type: 'Support',      status: 'completed', statusVariant: 'green',  refLabel: 'Support Ticket', refHref: id => `/support/${id}` },
  'ride.flag':                { label: 'Ride flagged',             type: 'Ride',         status: 'flagged',   statusVariant: 'orange', refLabel: 'Ride Details',   refHref: id => `/rides/${id}` },
  'ride.complete':            { label: 'Ride completed',           type: 'Ride',         status: 'completed', statusVariant: 'green',  refLabel: 'Ride Details',   refHref: id => `/rides/${id}` },
  'ride.cancel':              { label: 'Ride cancelled by driver', type: 'Ride',         status: 'cancelled', statusVariant: 'red',    refLabel: 'Ride Details',   refHref: id => `/rides/${id}` },
}

// ── Dev mock data (shown when DB returns empty) ───────────────────────────────
const MOCK_LOGS: AuditLog[] = [
  { id: 'm1', action: 'driver.approve',      entity_type: 'driver',       entity_id: '1',  metadata: { driver_name: 'John M.' },    admin_email: 'admin@panda.com', admin_id: null, admin_role: 'super_admin', old_value: null, new_value: null, ip_address: null, user_agent: null, created_at: new Date(Date.now() - 2  * 60_000).toISOString() },
  { id: 'm2', action: 'subscription.assign', entity_type: 'subscription', entity_id: '2',  metadata: { name: 'Weekly Plan' },       admin_email: 'admin@panda.com', admin_id: null, admin_role: 'super_admin', old_value: null, new_value: null, ip_address: null, user_agent: null, created_at: new Date(Date.now() - 5  * 60_000).toISOString() },
  { id: 'm3', action: 'ride.complete',       entity_type: 'ride',         entity_id: '49321', metadata: { name: 'Ride #49321' },    admin_email: 'admin@panda.com', admin_id: null, admin_role: 'super_admin', old_value: null, new_value: null, ip_address: null, user_agent: null, created_at: new Date(Date.now() - 8  * 60_000).toISOString() },
  { id: 'm4', action: 'driver.signup',       entity_type: 'driver',       entity_id: '3',  metadata: { driver_name: 'Asha K.' },    admin_email: 'admin@panda.com', admin_id: null, admin_role: 'super_admin', old_value: null, new_value: null, ip_address: null, user_agent: null, created_at: new Date(Date.now() - 15 * 60_000).toISOString() },
  { id: 'm5', action: 'ride.cancel',         entity_type: 'ride',         entity_id: '49318', metadata: { name: 'Ride #49318' },    admin_email: 'admin@panda.com', admin_id: null, admin_role: 'super_admin', old_value: null, new_value: null, ip_address: null, user_agent: null, created_at: new Date(Date.now() - 30 * 60_000).toISOString() },
  { id: 'm6', action: 'subscription.expire', entity_type: 'subscription', entity_id: '5',  metadata: { driver_name: 'Neema P.' },   admin_email: 'admin@panda.com', admin_id: null, admin_role: 'super_admin', old_value: null, new_value: null, ip_address: null, user_agent: null, created_at: new Date(Date.now() - 3  * 3_600_000).toISOString() },
  { id: 'm7', action: 'support.ticket.open', entity_type: 'support',      entity_id: '49112', metadata: { name: 'Ride #49112' },   admin_email: 'admin@panda.com', admin_id: null, admin_role: 'super_admin', old_value: null, new_value: null, ip_address: null, user_agent: null, created_at: new Date(Date.now() - 26 * 3_600_000).toISOString() },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function getRefName(log: AuditLog): string {
  return (
    (log.metadata?.driver_name as string | undefined) ??
    (log.metadata?.name as string | undefined) ??
    log.admin_email.split('@')[0]
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export function RecentActivityTable({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [logs, setLogs] = useState<AuditLog[]>(
    initialLogs.length > 0 ? initialLogs : MOCK_LOGS
  )
  const [search, setSearch] = useState('')

  // Realtime subscription
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
    const type = meta?.type ?? log.entity_type
    const name = getRefName(log)
    const q = search.toLowerCase()
    return label.toLowerCase().includes(q) || type.toLowerCase().includes(q) || name.toLowerCase().includes(q)
  })

  return (
    <div className="bg-white rounded-2xl overflow-hidden flex flex-col h-full">

      {/* ── Card header ───────────────────────────────────────── */}
      <div className="flex items-center px-6 py-4 border-b border-gray-100">
        {/* Left half — title */}
        <div className="flex items-center gap-1.5 w-1/2">
          <span className="text-base font-medium text-[#1d242d] tracking-[-0.5px]">Recent Activity</span>
          <HugeiconsIcon icon={InformationCircleIcon} size={15} color="#d1d5db" strokeWidth={1.5} />
        </div>

        {/* Right half — search + filter grouped */}
        <div className="flex items-center gap-2 w-1/2">
          <SearchBar value={search} onChange={setSearch} placeholder="Search" className="flex-1" />
          <FilterButton />
        </div>
      </div>

      {/* ── Table column headers ───────────────────────────────── */}
      <div className="grid px-6 py-3 border-b border-gray-100"
        style={{ gridTemplateColumns: '2.5fr 1fr 2fr 1.3fr 1fr' }}>
        {['Event', 'Type', 'Reference', 'Status', 'Time'].map(col => (
          <span key={col} className="text-sm font-semibold text-[#1d242d]">{col}</span>
        ))}
      </div>

      {/* ── Rows ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-6 py-10 text-sm text-gray-400 text-center">No activity found</div>
        ) : (
          filtered.slice(0, 20).map((log, i) => {
            const meta = ACTION_META[log.action]
            const refName = getRefName(log)
            const refLabel = meta?.refLabel ?? log.entity_type
            const refHref = meta?.refHref(log.entity_id) ?? '#'
            const isEven = i % 2 === 1

            return (
              <div
                key={log.id}
                className={`grid px-6 py-3.5 items-center text-sm transition-colors hover:bg-[#eef0fb] ${
                  isEven ? 'bg-[#F5F7FF]' : 'bg-white'
                }`}
                style={{ gridTemplateColumns: '2.5fr 1fr 2fr 1.3fr 1fr' }}
              >
                {/* Event */}
                <span className="text-[#1d242d] font-normal">{meta?.label ?? log.action}</span>

                {/* Type */}
                <span className="text-gray-500">{meta?.type ?? log.entity_type}</span>

                {/* Reference */}
                <Link
                  href={refHref}
                  className="flex items-center gap-1 group"
                >
                  <span className="font-semibold text-[#1d242d] group-hover:underline">{refName}</span>
                  <span className="text-gray-400"> → </span>
                  <span className="text-gray-500 group-hover:text-[#2B39C7] group-hover:underline transition-colors">{refLabel}</span>
                </Link>

                {/* Status */}
                <span className="flex items-center">
                  <Badge variant={meta?.statusVariant ?? 'gray'}>
                    {meta?.status ?? 'done'}
                  </Badge>
                </span>

                {/* Time */}
                <span className="text-gray-400 text-xs">{timeAgoShort(log.created_at)}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
