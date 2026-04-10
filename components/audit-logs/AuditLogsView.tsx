'use client'

import { useState } from 'react'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { timeAgo } from '@/lib/utils'
import type { AuditLog } from '@/lib/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const ENTITY_TYPES = [
  { value: '',               label: 'All Entities' },
  { value: 'driver',         label: 'Driver' },
  { value: 'ride',           label: 'Ride' },
  { value: 'support_ticket', label: 'Support Ticket' },
  { value: 'subscription',   label: 'Subscription' },
  { value: 'pricing_rule',   label: 'Pricing Rule' },
  { value: 'admin_user',     label: 'Admin User' },
  { value: 'zone',           label: 'Zone' },
  { value: 'custom_role',    label: 'Role' },
  { value: 'system_config',  label: 'System Config' },
]

export const ACTION_LABELS: Record<string, string> = {
  'driver.approve':           'Driver Approved',
  'driver.reject':            'Driver Rejected',
  'driver.suspend':           'Driver Suspended',
  'driver.reactivate':        'Driver Reactivated',
  'driver.flag':              'Driver Flagged',
  'ride.flag':                'Ride Flagged',
  'subscription.assign':      'Subscription Assigned',
  'subscription.revoke':      'Subscription Revoked',
  'subscription.extend':      'Subscription Extended',
  'subscription.plan.create': 'Plan Created',
  'subscription.plan.update': 'Plan Updated',
  'pricing.rule.create':      'Pricing Rule Created',
  'pricing.rule.deactivate':  'Pricing Rule Deactivated',
  'support.ticket.assign':    'Ticket Assigned',
  'support.ticket.resolve':   'Ticket Resolved',
  'support.ticket.message':   'Message Sent',
  'support.fare.adjust':      'Fare Adjusted',
  'support.refund.issue':     'Refund Issued',
  'admin.user.create':        'Admin Created',
  'admin.user.deactivate':    'Admin Deactivated',
  'admin.user.role_change':   'Admin Role Changed',
  'admin.user.update':        'Admin Updated',
  'zone.create':              'Zone Created',
  'zone.update':              'Zone Updated',
  'role.create':              'Role Created',
  'role.update':              'Role Updated',
  'role.delete':              'Role Deleted',
  'settings.config.update':   'Config Updated',
}

const ACTION_COLOR_MAP: Record<string, string> = {
  approve:    'bg-green-100 text-green-700',
  create:     'bg-blue-100 text-blue-700',
  assign:     'bg-blue-100 text-blue-700',
  resolve:    'bg-green-100 text-green-700',
  reactivate: 'bg-green-100 text-green-700',
  reject:     'bg-red-100 text-red-700',
  suspend:    'bg-orange-100 text-orange-700',
  flag:       'bg-yellow-100 text-yellow-700',
  deactivate: 'bg-red-100 text-red-700',
  delete:     'bg-red-100 text-red-700',
  update:     'bg-purple-100 text-purple-700',
  message:    'bg-gray-100 text-gray-600',
  adjust:     'bg-orange-100 text-orange-700',
  refund:     'bg-orange-100 text-orange-700',
}

function actionColor(action: string) {
  for (const [key, cls] of Object.entries(ACTION_COLOR_MAP)) {
    if (action.includes(key)) return cls
  }
  return 'bg-gray-100 text-gray-600'
}

const PER_PAGE = 50

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${actionColor(log.action)}`}>
              {ACTION_LABELS[log.action] ?? log.action}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {log.old_value && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Before</p>
              <pre className="text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-auto max-h-40 text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(log.old_value, null, 2)}
              </pre>
            </div>
          )}
          {log.new_value && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">After</p>
              <pre className="text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-auto max-h-40 text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(log.new_value, null, 2)}
              </pre>
            </div>
          )}
          {log.metadata && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Metadata</p>
              <pre className="text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-auto max-h-40 text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
          {log.user_agent && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">User Agent</p>
              <p className="text-xs text-gray-500 break-all">{log.user_agent}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  initialLogs: AuditLog[]
  initialTotal: number
}

export function AuditLogsView({ initialLogs, initialTotal }: Props) {
  const [logs, setLogs]       = useState<AuditLog[]>(initialLogs)
  const [total, setTotal]     = useState(initialTotal)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [entityType, setEntityType] = useState('')
  const [fromDate, setFromDate]     = useState('')
  const [toDate, setToDate]         = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  async function fetchLogs(
    p = 1,
    filters?: { search?: string; entityType?: string; fromDate?: string; toDate?: string },
  ) {
    const f = filters ?? { search, entityType, fromDate, toDate }
    const params = new URLSearchParams({ page: String(p) })
    if (f.search)     params.set('action', f.search)
    if (f.entityType) params.set('entity_type', f.entityType)
    if (f.fromDate)   params.set('from_date', f.fromDate)
    if (f.toDate)     params.set('to_date', f.toDate + 'T23:59:59Z')
    const res = await fetch(`/api/audit-logs?${params.toString()}`)
    if (res.ok) {
      const d = await res.json()
      setLogs(d.logs ?? [])
      setTotal(d.total ?? 0)
      setPage(p)
    }
  }

  function handleSearch(v: string) {
    setSearch(v)
    fetchLogs(1, { search: v, entityType, fromDate, toDate })
  }

  // Extra filters rendered in DataTable headerRight
  const filters = (
    <div className="flex items-center gap-2">
      <select
        value={entityType}
        onChange={e => { setEntityType(e.target.value); fetchLogs(1, { search, entityType: e.target.value, fromDate, toDate }) }}
        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2B39C7]/30 text-gray-600"
      >
        {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <input
        type="date"
        value={fromDate}
        onChange={e => { setFromDate(e.target.value); fetchLogs(1, { search, entityType, fromDate: e.target.value, toDate }) }}
        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B39C7]/30 text-gray-500"
      />
      <input
        type="date"
        value={toDate}
        onChange={e => { setToDate(e.target.value); fetchLogs(1, { search, entityType, fromDate, toDate: e.target.value }) }}
        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B39C7]/30 text-gray-500"
      />
    </div>
  )

  const columns = [
    {
      key: 'action',
      label: 'Action',
      render: (log: AuditLog) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${actionColor(log.action)}`}>
          {ACTION_LABELS[log.action] ?? log.action}
        </span>
      ),
    },
    {
      key: 'entity_type',
      label: 'Entity',
      render: (log: AuditLog) => (
        <div>
          <p className="text-sm font-medium text-[#1d242d] capitalize">{log.entity_type.replace(/_/g, ' ')}</p>
          {log.entity_id && (
            <p className="text-xs text-gray-400 font-mono">{log.entity_id.slice(0, 8)}…</p>
          )}
        </div>
      ),
    },
    {
      key: 'admin_email',
      label: 'Admin',
      render: (log: AuditLog) => (
        <div>
          <p className="text-sm text-[#1d242d]">{log.admin_email}</p>
          <p className="text-xs text-gray-400 capitalize">{log.admin_role?.replace(/_/g, ' ')}</p>
        </div>
      ),
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (log: AuditLog) => (
        <span className="text-sm font-mono text-gray-500">{log.ip_address ?? '—'}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Time',
      render: (log: AuditLog) => (
        <span className="text-sm text-gray-400">{timeAgo(log.created_at)}</span>
      ),
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={logs}
        keyField="id"
        cardTitle="Audit Logs"
        searchValue={search}
        onSearch={handleSearch}
        headerRight={filters}
        emptyMessage="No audit logs found."
        rowActions={log => {
          const l = log as AuditLog
          const hasDetail = l.old_value || l.new_value || l.metadata
          if (!hasDetail) return []
          return [{ label: 'View Details', onClick: () => setSelectedLog(l) }]
        }}
      />
      <Pagination
        page={page}
        total={total}
        perPage={PER_PAGE}
        onPageChange={p => fetchLogs(p)}
      />

      {selectedLog && (
        <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </>
  )
}
