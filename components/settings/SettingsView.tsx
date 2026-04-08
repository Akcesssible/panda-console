'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatDateTime, timeAgo } from '@/lib/utils'
import type { AdminUser, AuditLog, Zone } from '@/lib/types'

const TABS = [
  { key: 'admin_users', label: 'Admin Users' },
  { key: 'zones', label: 'Cities & Zones' },
  { key: 'config', label: 'System Config' },
  { key: 'logs', label: 'System Logs' },
]

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  ops_admin: 'Ops Admin',
  support_agent: 'Support Agent',
  finance_viewer: 'Finance Viewer',
}

interface SystemConfig { id: string; key: string; value: string; description: string | null }

export function SettingsView({
  tab, admins, zones, config, logs, currentAdmin,
}: {
  tab: string
  admins: AdminUser[]
  zones: Zone[]
  config: SystemConfig[]
  logs: AuditLog[]
  currentAdmin: AdminUser
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [addAdminModal, setAddAdminModal] = useState(false)
  const [addZoneModal, setAddZoneModal] = useState(false)

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => params.set(k, v))
    router.push(`/settings?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 pt-4 flex items-center justify-between">
        <Tabs tabs={TABS} active={tab} onChange={key => navigate({ tab: key })} />
        {tab === 'admin_users' && (
          <button onClick={() => setAddAdminModal(true)} className="px-3 py-1.5 text-sm font-medium bg-primary$ text-white rounded-lg hover:bg-primary-dark$">
            + Add Admin
          </button>
        )}
        {tab === 'zones' && (
          <button onClick={() => setAddZoneModal(true)} className="px-3 py-1.5 text-sm font-medium bg-primary$ text-white rounded-lg hover:bg-primary-dark$">
            + Add Zone
          </button>
        )}
      </div>

      <div className="p-5">
        {tab === 'admin_users' && <AdminUsersTab admins={admins} currentAdmin={currentAdmin} onRefresh={() => router.refresh()} />}
        {tab === 'zones' && <ZonesTab zones={zones} onRefresh={() => router.refresh()} />}
        {tab === 'config' && <ConfigTab config={config} onRefresh={() => router.refresh()} />}
        {tab === 'logs' && <AuditLogsTab logs={logs} />}
      </div>

      <AddAdminModal open={addAdminModal} onClose={() => { setAddAdminModal(false); router.refresh() }} />
      <AddZoneModal open={addZoneModal} onClose={() => { setAddZoneModal(false); router.refresh() }} />
    </div>
  )
}

function AdminUsersTab({ admins, currentAdmin, onRefresh }: { admins: AdminUser[]; currentAdmin: AdminUser; onRefresh: () => void }) {
  async function toggleActive(admin: AdminUser) {
    await fetch(`/api/settings/admin-users/${admin.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !admin.is_active }),
    })
    onRefresh()
  }

  return (
    <div className="divide-y divide-gray-100">
      {admins.map(admin => (
        <div key={admin.id} className="py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{admin.full_name}</p>
            <p className="text-xs text-gray-500">{admin.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="blue">{ROLE_LABELS[admin.role] ?? admin.role}</Badge>
            <Badge variant={admin.is_active ? 'green' : 'gray'}>{admin.is_active ? 'Active' : 'Inactive'}</Badge>
            {admin.id !== currentAdmin.id && (
              <button
                onClick={() => toggleActive(admin)}
                className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-2 py-1 rounded"
              >
                {admin.is_active ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function ZonesTab({ zones, onRefresh }: { zones: Zone[]; onRefresh: () => void }) {
  async function toggleZone(zone: Zone) {
    await fetch(`/api/settings/zones/${zone.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !zone.is_active }),
    })
    onRefresh()
  }

  return (
    <div className="divide-y divide-gray-100">
      {zones.map(zone => (
        <div key={zone.id} className="py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{zone.name}</p>
            <p className="text-xs text-gray-500">{zone.city}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={zone.is_active ? 'green' : 'gray'}>{zone.is_active ? 'Active' : 'Inactive'}</Badge>
            <button
              onClick={() => toggleZone(zone)}
              className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-2 py-1 rounded"
            >
              {zone.is_active ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ConfigTab({ config, onRefresh }: { config: SystemConfig[]; onRefresh: () => void }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [value, setValue] = useState('')

  async function saveConfig(key: string) {
    await fetch('/api/settings/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    setEditing(null)
    onRefresh()
  }

  return (
    <div className="divide-y divide-gray-100">
      {config.map(item => (
        <div key={item.id} className="py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">{item.key}</p>
            {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {editing === item.key ? (
              <>
                <input
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-sm w-28"
                />
                <button onClick={() => saveConfig(item.key)} className="text-xs text-green-600 font-medium">Save</button>
                <button onClick={() => setEditing(null)} className="text-xs text-gray-400">Cancel</button>
              </>
            ) : (
              <>
                <span className="text-sm font-mono text-gray-700">{item.value}</span>
                <button
                  onClick={() => { setEditing(item.key); setValue(item.value) }}
                  className="text-xs text-primary$ hover:text-primary-dark$"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function AuditLogsTab({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="divide-y divide-gray-100">
      <div className="py-2 grid grid-cols-4 gap-4 text-xs font-medium text-gray-400 uppercase tracking-wide">
        <span className="col-span-2">Action</span>
        <span>Admin</span>
        <span>Time</span>
      </div>
      {logs.map(log => (
        <div key={log.id} className="py-3 grid grid-cols-4 gap-4 text-sm">
          <div className="col-span-2">
            <p className="text-gray-800 font-mono text-xs">{log.action}</p>
            <p className="text-xs text-gray-400">{log.entity_type} {log.entity_id ? `· ${log.entity_id.slice(0, 8)}…` : ''}</p>
          </div>
          <span className="text-gray-500 truncate text-xs">{log.admin_email}</span>
          <span className="text-gray-400 text-xs">{timeAgo(log.created_at)}</span>
        </div>
      ))}
    </div>
  )
}

function AddAdminModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ full_name: '', email: '', role: 'support_agent' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    await fetch('/api/settings/admin-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Admin User"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button disabled={!form.full_name || !form.email || loading} onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-primary$ text-white rounded-lg hover:bg-primary-dark$ disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Admin'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {[
          { label: 'Full Name', field: 'full_name', placeholder: 'John Doe' },
          { label: 'Email', field: 'email', placeholder: 'admin@pandahailing.com' },
        ].map(({ label, field, placeholder }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              value={form[field as keyof typeof form]}
              onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder={placeholder}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary$"
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={form.role}
            onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary$"
          >
            <option value="ops_admin">Operations Admin</option>
            <option value="support_agent">Support Agent</option>
            <option value="finance_viewer">Finance Viewer</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
      </div>
    </Modal>
  )
}

function AddZoneModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', city: 'Dar es Salaam' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    await fetch('/api/settings/zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Zone"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button disabled={!form.name || loading} onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-primary$ text-white rounded-lg hover:bg-primary-dark$ disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Zone'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Kinondoni"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary$" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Dar es Salaam"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary$" />
        </div>
      </div>
    </Modal>
  )
}
