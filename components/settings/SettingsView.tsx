'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  UserAdd01Icon, UserCircleIcon, ShieldUserIcon,
  Tick02Icon, Cancel01Icon, MoreVerticalIcon,
} from '@hugeicons-pro/core-stroke-rounded'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { formatDateTime, formatDate, timeAgo } from '@/lib/utils'
import type { AdminUser, AuditLog, Zone } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SystemConfig { id: string; key: string; value: string; description: string | null }

export interface CustomRole {
  id: string
  name: string
  description: string | null
  permissions: Record<string, Record<string, boolean>>
  is_active: boolean
  created_by: string | null
  created_at: string
}

// ── Permissions config ────────────────────────────────────────────────────────

const MODULES = [
  { key: 'dashboard',     label: 'Dashboard' },
  { key: 'drivers',       label: 'Drivers Management' },
  { key: 'rides',         label: 'Rides Management' },
  { key: 'riders',        label: 'Riders Management' },
  { key: 'subscriptions', label: 'Subscriptions' },
  { key: 'pricing',       label: 'Pricing Rules' },
  { key: 'support',       label: 'Support Tickets' },
  { key: 'reports',       label: 'Reports & Analytics' },
  { key: 'settings',      label: 'Settings' },
]

const PERMISSIONS = ['create', 'read', 'update', 'delete', 'approve'] as const
type Permission = typeof PERMISSIONS[number]

// Labels for the Add Role modal checkboxes
const PERM_LABELS: Record<Permission, string> = {
  create: 'Create', read: 'Read', update: 'Update', delete: 'Delete', approve: 'Approve',
}

// Pill labels in the table (Write instead of Create, per design)
const PERM_PILL_LABELS: Record<Permission, string> = {
  create: 'Write', read: 'Read', update: 'Update', delete: 'Delete', approve: 'Approve',
}

// These IDs match the fixed UUIDs seeded in seed.sql — used to prevent deletion
const BUILTIN_ROLE_IDS = new Set([
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000003',
  'aaaaaaaa-0000-0000-0000-000000000004',
])

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', ops_admin: 'Ops Admin',
  support_agent: 'Support Agent', finance_viewer: 'Finance Viewer',
}

function defaultPermissions(): Record<string, Record<Permission, boolean>> {
  return Object.fromEntries(
    MODULES.map(m => [m.key, Object.fromEntries(PERMISSIONS.map(p => [p, false])) as Record<Permission, boolean>])
  )
}

// ── Root view ─────────────────────────────────────────────────────────────────

export function SettingsView({
  tab, admins, zones, config, logs, currentAdmin, customRoles,
}: {
  tab: string
  admins: AdminUser[]
  zones: Zone[]
  config: SystemConfig[]
  logs: AuditLog[]
  currentAdmin: AdminUser
  customRoles: CustomRole[]
}) {
  const router = useRouter()
  const [addUserModal, setAddUserModal]   = useState(false)
  const [addZoneModal, setAddZoneModal]   = useState(false)
  const [addRoleModal, setAddRoleModal]   = useState(false)
  const [editingRole, setEditingRole]     = useState<CustomRole | null>(null)

  const refresh = () => router.refresh()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

      {/* Tab action bar — only for zones now; users & roles have their button inside the DataTable header */}
      {tab === 'zones' && (
        <div className="px-5 pt-4 flex justify-end">
          <button onClick={() => setAddZoneModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#2B39C7] text-white rounded-lg hover:bg-[#202b95] transition-colors">
            + Add Zone
          </button>
        </div>
      )}

      <div className="p-5">
        {tab === 'users'  && <UsersTab admins={admins} currentAdmin={currentAdmin} onRefresh={refresh} onInviteUser={() => setAddUserModal(true)} />}
        {tab === 'roles'  && <RolesTab customRoles={customRoles} onRefresh={refresh} onAddRole={() => setAddRoleModal(true)} onEditRole={setEditingRole} isSuperAdmin={currentAdmin.role === 'super_admin'} />}
        {tab === 'zones'  && <ZonesTab zones={zones} onRefresh={refresh} />}
        {tab === 'config' && <ConfigTab config={config} onRefresh={refresh} />}
        {tab === 'logs'   && <AuditLogsTab logs={logs} />}
      </div>

      <AddUserModal open={addUserModal} onClose={() => { setAddUserModal(false); refresh() }} />
      <AddRoleModal open={addRoleModal} onClose={() => { setAddRoleModal(false); refresh() }} />
      <AddZoneModal open={addZoneModal} onClose={() => { setAddZoneModal(false); refresh() }} />
      {editingRole && (
        <EditRoleModal
          role={editingRole}
          onClose={() => setEditingRole(null)}
          onRefresh={() => { setEditingRole(null); refresh() }}
        />
      )}
    </div>
  )
}

// Vibrant avatar palette — 12 colours, cycles deterministically by user ID
const AVATAR_PALETTE = [
  { bg: '#FDE68A', text: '#92400E' }, // amber
  { bg: '#6EE7B7', text: '#065F46' }, // emerald
  { bg: '#93C5FD', text: '#1E3A8A' }, // blue
  { bg: '#FCA5A5', text: '#7F1D1D' }, // red
  { bg: '#C4B5FD', text: '#4C1D95' }, // violet
  { bg: '#FCD34D', text: '#78350F' }, // yellow
  { bg: '#6EE7F7', text: '#164E63' }, // cyan
  { bg: '#F9A8D4', text: '#831843' }, // pink
  { bg: '#86EFAC', text: '#14532D' }, // green
  { bg: '#FDBA74', text: '#7C2D12' }, // orange
  { bg: '#A5B4FC', text: '#312E81' }, // indigo
  { bg: '#F0ABFC', text: '#701A75' }, // fuchsia
]

/** Stable colour pick based on user ID — same user always gets same colour */
function avatarStyle(userId: string) {
  const hash = userId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

/** Returns up to 2 initials: first letter of first name + first letter of last name */
function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab({ admins, currentAdmin, onRefresh, onInviteUser }: {
  admins: AdminUser[]
  currentAdmin: AdminUser
  onRefresh: () => void
  onInviteUser: () => void
}) {
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [perPage, setPerPage] = useState(5)

  async function toggleActive(admin: AdminUser) {
    await fetch(`/api/settings/admin-users/${admin.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !admin.is_active }),
    })
    onRefresh()
  }

  const filtered  = admins.filter(a =>
    a.full_name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  )
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const columns = [
    {
      key: 'full_name',
      label: 'Users',
      render: (admin: AdminUser) => {
        return (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar id={admin.id} name={admin.full_name} size="lg" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1d242d] truncate flex items-center gap-1.5">
                {admin.full_name}
                {admin.id === currentAdmin.id && (
                  <span className="text-[10px] font-medium text-[#2B39C7] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">You</span>
                )}
              </p>
              <p className="text-xs text-gray-400 truncate">{admin.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'role',
      label: 'Roles',
      render: (admin: AdminUser) => (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-[#2B39C7]/40 text-[#2B39C7] bg-[#2B39C7]/[0.06] whitespace-nowrap">
          {ROLE_LABELS[admin.role] ?? admin.role}
        </span>
      ),
    },
    {
      key: 'updated_at',
      label: 'Last Activity',
      render: (admin: AdminUser) => (
        <span className="text-sm text-[#1d242d]">{timeAgo(admin.updated_at)}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Invited By',
      render: (admin: AdminUser) => (
        <div>
          <p className="text-sm font-medium text-[#1d242d]">System</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(admin.created_at)}</p>
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (admin: AdminUser) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${
          admin.is_active
            ? 'border-green-400 text-green-600 bg-green-50'
            : 'border-gray-300 text-gray-500 bg-gray-50'
        }`}>
          {admin.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  const inviteBtn = (
    <button
      onClick={onInviteUser}
      className="bg-[#2B39C7] hover:bg-[#202b95] text-white text-sm font-semibold rounded-full px-5 py-2 transition-colors whitespace-nowrap"
    >
      Invite User
    </button>
  )

  return (
    <div className="-mx-5 -mt-5">
      <DataTable
        columns={columns}
        data={paginated}
        keyField="id"
        cardTitle="Users"
        searchValue={search}
        onSearch={v => { setSearch(v); setPage(1) }}
        headerRight={inviteBtn}
        selectable
        emptyMessage="No users found."
        rowActions={admin =>
          admin.id === currentAdmin.id
            ? []
            : [
                {
                  label: admin.is_active ? 'Deactivate' : 'Activate',
                  onClick: () => toggleActive(admin),
                  danger: admin.is_active,
                },
              ]
        }
      />
      <Pagination
        page={page}
        total={filtered.length}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={n => { setPerPage(n); setPage(1) }}
      />
    </div>
  )
}

// ── Roles Tab ─────────────────────────────────────────────────────────────────

function RolesTab({ customRoles, onRefresh, onAddRole, onEditRole, isSuperAdmin }: {
  customRoles: CustomRole[]
  onRefresh: () => void
  onAddRole: () => void
  onEditRole: (role: CustomRole) => void
  isSuperAdmin: boolean
}) {
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [perPage, setPerPage] = useState(5)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function deleteRole(id: string) {
    if (!confirm('Delete this role? This cannot be undone.')) return
    setDeleting(id)
    await fetch(`/api/settings/roles/${id}`, { method: 'DELETE' })
    setDeleting(null)
    onRefresh()
  }

  // Unique permission types granted in at least one module for a role
  function grantedPills(role: CustomRole): Permission[] {
    return [...new Set(
      Object.values(role.permissions)
        .flatMap(m => (Object.entries(m) as [Permission, boolean][])
          .filter(([, v]) => v).map(([k]) => k))
    )] as Permission[]
  }

  const filtered  = customRoles.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  // Column definitions for DataTable
  const columns = [
    {
      key: 'name',
      label: 'Roles',
      render: (role: CustomRole) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1d242d]">{role.name}</span>
          {BUILTIN_ROLE_IDS.has(role.id) && (
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
              Built-in
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (role: CustomRole) => (
        <span className="text-sm text-gray-400 line-clamp-2">{role.description ?? '—'}</span>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (role: CustomRole) => {
        const pills = grantedPills(role)
        return (
          <div className="flex flex-wrap gap-1.5">
            {pills.length > 0
              ? pills.map(p => (
                  <span key={p} className="text-xs font-medium text-[#2B39C7] bg-[#2B39C7]/[0.07] border border-[#2B39C7]/20 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    {PERM_PILL_LABELS[p]}
                  </span>
                ))
              : <span className="text-xs text-gray-300">No permissions</span>
            }
          </div>
        )
      },
    },
    {
      key: 'created_by',
      label: 'Created By',
      render: (role: CustomRole) => (
        <div>
          <p className="font-medium text-[#1d242d] text-sm">
            {BUILTIN_ROLE_IDS.has(role.id) ? 'System' : (role.created_by ?? 'Unknown')}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(role.created_at)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (role: CustomRole) => (
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${role.is_active !== false ? 'bg-green-500' : 'bg-orange-400'}`} />
          <span className={`text-sm font-medium ${role.is_active !== false ? 'text-green-600' : 'text-orange-500'}`}>
            {role.is_active !== false ? 'Active' : 'Inactive'}
          </span>
        </div>
      ),
    },
  ]

  // "Add New Role" button — passed as headerRight to DataTable so it renders
  // in the same header row as the title, search, and filter — matching the
  // exact same card header structure used in Drivers, Rides, Riders, etc.
  const addRoleBtn = (
    <button
      onClick={onAddRole}
      className="bg-[#2B39C7] hover:bg-[#202b95] text-white text-sm font-semibold rounded-full px-5 py-2 transition-colors whitespace-nowrap"
    >
      Add New Role
    </button>
  )

  // Negative margins break out of the parent's p-5 padding so this table
  // sits flush with the card edges — identical to every other module table.
  return (
    <div className="-mx-5 -mt-5">
      <DataTable
        columns={columns}
        data={paginated}
        keyField="id"
        cardTitle="Roles"
        searchValue={search}
        onSearch={v => { setSearch(v); setPage(1) }}
        headerRight={addRoleBtn}
        selectable
        emptyMessage="No roles found."
        onRowClick={isSuperAdmin ? (role: CustomRole) => onEditRole(role) : undefined}
        rowActions={role => {
          if (BUILTIN_ROLE_IDS.has(role.id)) return []
          return [
            {
              label: deleting === role.id ? 'Deleting…' : 'Delete Role',
              onClick: () => deleteRole(role.id),
              danger: true,
            },
          ]
        }}
      />
      <Pagination
        page={page}
        total={filtered.length}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={n => { setPerPage(n); setPage(1) }}
      />
    </div>
  )
}

// ── Zones Tab ─────────────────────────────────────────────────────────────────

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
            <button onClick={() => toggleZone(zone)}
              className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-2 py-1 rounded">
              {zone.is_active ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Config Tab ────────────────────────────────────────────────────────────────

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
                <input value={value} onChange={e => setValue(e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-sm w-28" />
                <button onClick={() => saveConfig(item.key)} className="text-xs text-green-600 font-medium">Save</button>
                <button onClick={() => setEditing(null)} className="text-xs text-gray-400">Cancel</button>
              </>
            ) : (
              <>
                <span className="text-sm font-mono text-gray-700">{item.value}</span>
                <button onClick={() => { setEditing(item.key); setValue(item.value) }}
                  className="text-xs text-[#2B39C7] hover:underline">Edit</button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Audit Logs Tab ────────────────────────────────────────────────────────────

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
            <p className="text-xs text-gray-400">{log.entity_type}{log.entity_id ? ` · ${log.entity_id.slice(0, 8)}…` : ''}</p>
          </div>
          <span className="text-gray-500 truncate text-xs">{log.admin_email}</span>
          <span className="text-gray-400 text-xs">{timeAgo(log.created_at)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Add User Modal ────────────────────────────────────────────────────────────

function AddUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ full_name: '', email: '', role: 'support_agent' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!form.full_name.trim() || !form.email.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/settings/admin-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Something went wrong')
      setLoading(false)
      return
    }
    setLoading(false)
    setForm({ full_name: '', email: '', role: 'support_agent' })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-[#ECEEF3] flex items-center justify-center">
            <HugeiconsIcon icon={UserCircleIcon} size={18} color="#2B39C7" strokeWidth={1.5} />
          </div>
          <h2 className="text-base font-semibold text-[#1d242d]">Invite New User</h2>
          <button onClick={onClose} className="ml-auto text-gray-300 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1d242d] mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              placeholder="e.g. James Mwangi"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B39C7]/30 focus:border-[#2B39C7]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1d242d] mb-1.5">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="user@pandahailing.com"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B39C7]/30 focus:border-[#2B39C7]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1d242d] mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B39C7]/30 focus:border-[#2B39C7] bg-white"
            >
              <option value="support_agent">Support Agent</option>
              <option value="ops_admin">Operations Admin</option>
              <option value="finance_viewer">Finance Viewer</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
            Cancel
          </button>
          <button
            disabled={!form.full_name.trim() || !form.email.trim() || loading}
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-medium bg-[#2B39C7] text-white rounded-xl hover:bg-[#202b95] disabled:opacity-50 transition-colors">
            {loading ? 'Inviting…' : 'Invite User'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add Role Modal ────────────────────────────────────────────────────────────

function AddRoleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<Record<string, Record<Permission, boolean>>>(defaultPermissions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const tableRef = useRef<HTMLDivElement>(null)

  function toggle(module: string, perm: Permission) {
    setPermissions(prev => ({
      ...prev,
      [module]: { ...prev[module], [perm]: !prev[module][perm] },
    }))
  }

  function scroll(dir: 'up' | 'down') {
    tableRef.current?.scrollBy({ top: dir === 'down' ? 80 : -80, behavior: 'smooth' })
  }

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/settings/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null, permissions }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Something went wrong')
      setLoading(false)
      return
    }
    setLoading(false)
    setName('')
    setDescription('')
    setPermissions(defaultPermissions())
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[732px] mx-4 flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-[#ECEEF3] flex items-center justify-center">
            <HugeiconsIcon icon={ShieldUserIcon} size={18} color="#2B39C7" strokeWidth={1.5} />
          </div>
          <h2 className="text-base font-semibold text-[#1d242d]">Add New Role</h2>
          <button onClick={onClose} className="ml-auto text-gray-300 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pt-5 pb-4 space-y-4">
            {/* Role Name */}
            <div className="bg-[#E8E8E8] rounded-2xl px-4 pt-3 pb-3 border-2 border-transparent focus-within:border-[#1d242d] transition-colors">
              <label className="block font-mono text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">
                Role Name <span className="text-red-400">*</span>
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sales & Finance"
                className="w-full bg-transparent text-[#1d242d] text-sm placeholder-gray-400 focus:outline-none"
              />
            </div>

            {/* Role Description */}
            <div className="bg-[#E8E8E8] rounded-2xl px-4 pt-3 pb-3 border-2 border-transparent focus-within:border-[#1d242d] transition-colors">
              <label className="block font-mono text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">
                Role Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Write short description about the role"
                rows={3}
                className="w-full bg-transparent text-[#1d242d] text-sm placeholder-gray-400 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Permissions table */}
          <div ref={tableRef} className="px-6 pb-2 overflow-y-auto" style={{ maxHeight: 320 }}>
            {/* Table header */}
            <div className="grid gap-2 pb-2 border-b border-gray-100 sticky top-0 bg-white z-10"
              style={{ gridTemplateColumns: '1fr repeat(5, 64px)' }}>
              <span className="text-xs font-medium text-gray-400">Permissions</span>
              {PERMISSIONS.map(p => (
                <span key={p} className="text-xs font-medium text-gray-400 text-center">{PERM_LABELS[p]}</span>
              ))}
            </div>

            {/* Module rows */}
            <div className="divide-y divide-gray-50">
              {MODULES.map(mod => (
                <div key={mod.key} className="grid gap-2 py-3 items-center"
                  style={{ gridTemplateColumns: '1fr repeat(5, 64px)' }}>
                  <span className="text-sm text-[#1d242d]">{mod.label}</span>
                  {PERMISSIONS.map(perm => (
                    <div key={perm} className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => toggle(mod.key, perm)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all ${
                          permissions[mod.key]?.[perm]
                            ? 'bg-[#2B39C7] border-[#2B39C7]'
                            : 'bg-white border-gray-300 hover:border-[#2B39C7]/50'
                        }`}
                      >
                        {permissions[mod.key]?.[perm] && (
                          <HugeiconsIcon icon={Tick02Icon} size={12} color="white" strokeWidth={2.5} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          {/* Navigate arrows */}
          <div className="flex items-center gap-1.5">
            <button onClick={() => scroll('up')}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 text-sm">
              ↑
            </button>
            <button onClick={() => scroll('down')}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 text-sm">
              ↓
            </button>
            <span className="text-xs text-gray-400 ml-1">Navigate</span>
          </div>

          <div className="flex gap-2">
            {error && <p className="text-xs text-red-500 self-center mr-2">{error}</p>}
            <button onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-2xl hover:bg-gray-50">
              Cancel
            </button>
            <button
              disabled={!name.trim() || loading}
              onClick={handleSubmit}
              className={`px-5 py-2 text-sm font-semibold text-white rounded-2xl transition-colors ${
                name.trim() && !loading
                  ? 'bg-[#2B39C7] hover:bg-[#202b95]'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}>
              {loading ? 'Creating…' : 'Add a Role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Edit Role Modal ───────────────────────────────────────────────────────────

function EditRoleModal({ role, onClose, onRefresh }: {
  role: CustomRole
  onClose: () => void
  onRefresh: () => void
}) {
  const tableRef = useRef<HTMLDivElement>(null)

  const [name, setName]               = useState(role.name)
  const [description, setDescription] = useState(role.description ?? '')
  const [isActive, setIsActive]       = useState(role.is_active !== false)
  const [permissions, setPermissions] = useState<Record<string, Record<Permission, boolean>>>(
    () => {
      // Merge stored permissions with all modules so nothing is missing
      const base = defaultPermissions()
      for (const mod of MODULES) {
        if (role.permissions[mod.key]) {
          base[mod.key] = { ...base[mod.key], ...(role.permissions[mod.key] as Record<Permission, boolean>) }
        }
      }
      return base
    }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Detect any changes vs the original role
  const hasChanges =
    name.trim() !== role.name ||
    description.trim() !== (role.description ?? '') ||
    isActive !== (role.is_active !== false) ||
    JSON.stringify(permissions) !== JSON.stringify(
      (() => {
        const base = defaultPermissions()
        for (const mod of MODULES) {
          if (role.permissions[mod.key]) {
            base[mod.key] = { ...base[mod.key], ...(role.permissions[mod.key] as Record<Permission, boolean>) }
          }
        }
        return base
      })()
    )

  function toggle(module: string, perm: Permission) {
    setPermissions(prev => ({
      ...prev,
      [module]: { ...prev[module], [perm]: !prev[module][perm] },
    }))
  }

  function scroll(dir: 'up' | 'down') {
    tableRef.current?.scrollBy({ top: dir === 'down' ? 80 : -80, behavior: 'smooth' })
  }

  async function handleSubmit() {
    if (!name.trim() || !hasChanges) return
    setLoading(true)
    setError('')
    const res = await fetch(`/api/settings/roles/${role.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        permissions,
        is_active: isActive,
      }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Something went wrong')
      setLoading(false)
      return
    }
    setLoading(false)
    onRefresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[732px] mx-4 flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-[#ECEEF3] flex items-center justify-center">
            <HugeiconsIcon icon={ShieldUserIcon} size={18} color="#2B39C7" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#1d242d]">User Role</h2>
            <p className="text-xs text-gray-400 mt-0.5">{role.name}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-300 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pt-5 pb-4 space-y-4">

            {/* Role Name */}
            <div className="bg-[#E8E8E8] rounded-2xl px-4 pt-3 pb-3 border-2 border-transparent focus-within:border-[#1d242d] transition-colors">
              <label className="block font-mono text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">
                Role Name <span className="text-red-400">*</span>
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sales & Finance"
                className="w-full bg-transparent text-[#1d242d] text-sm placeholder-gray-400 focus:outline-none"
              />
            </div>

            {/* Role Description */}
            <div className="bg-[#E8E8E8] rounded-2xl px-4 pt-3 pb-3 border-2 border-transparent focus-within:border-[#1d242d] transition-colors">
              <label className="block font-mono text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">
                Role Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Write short description about the role"
                rows={3}
                className="w-full bg-transparent text-[#1d242d] text-sm placeholder-gray-400 focus:outline-none resize-none"
              />
            </div>

            {/* Active / Inactive toggle */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#F5F6FA] rounded-2xl">
              <div>
                <p className="text-sm font-semibold text-[#1d242d]">Role Status</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isActive ? 'This role is active and can be assigned to users.' : 'This role is inactive and cannot be assigned.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(v => !v)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 ${isActive ? 'bg-[#2B39C7]' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Permissions table */}
          <div ref={tableRef} className="px-6 pb-2 overflow-y-auto" style={{ maxHeight: 300 }}>
            <div className="grid gap-2 pb-2 border-b border-gray-100 sticky top-0 bg-white z-10"
              style={{ gridTemplateColumns: '1fr repeat(5, 64px)' }}>
              <span className="text-xs font-medium text-gray-400">Permissions</span>
              {PERMISSIONS.map(p => (
                <span key={p} className="text-xs font-medium text-gray-400 text-center">{PERM_LABELS[p]}</span>
              ))}
            </div>
            <div className="divide-y divide-gray-50">
              {MODULES.map(mod => (
                <div key={mod.key} className="grid gap-2 py-3 items-center"
                  style={{ gridTemplateColumns: '1fr repeat(5, 64px)' }}>
                  <span className="text-sm text-[#1d242d]">{mod.label}</span>
                  {PERMISSIONS.map(perm => (
                    <div key={perm} className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => toggle(mod.key, perm)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all ${
                          permissions[mod.key]?.[perm]
                            ? 'bg-[#2B39C7] border-[#2B39C7]'
                            : 'bg-white border-gray-300 hover:border-[#2B39C7]/50'
                        }`}
                      >
                        {permissions[mod.key]?.[perm] && (
                          <HugeiconsIcon icon={Tick02Icon} size={12} color="white" strokeWidth={2.5} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button onClick={() => scroll('up')}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 text-sm">↑</button>
            <button onClick={() => scroll('down')}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 text-sm">↓</button>
            <span className="text-xs text-gray-400 ml-1">Navigate</span>
          </div>
          <div className="flex gap-2 items-center">
            {error && <p className="text-xs text-red-500 mr-2">{error}</p>}
            <button onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-2xl hover:bg-gray-50">
              Cancel
            </button>
            <button
              disabled={!hasChanges || !name.trim() || loading}
              onClick={handleSubmit}
              className={`px-5 py-2 text-sm font-semibold text-white rounded-2xl transition-colors ${
                hasChanges && name.trim() && !loading
                  ? 'bg-[#2B39C7] hover:bg-[#202b95]'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {loading ? 'Updating…' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Add Zone Modal ────────────────────────────────────────────────────────────

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
    setForm({ name: '', city: 'Dar es Salaam' })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#1d242d]">Add Zone</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1d242d] mb-1.5">Zone Name</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Kinondoni"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B39C7]/30 focus:border-[#2B39C7]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1d242d] mb-1.5">City</label>
            <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Dar es Salaam"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B39C7]/30 focus:border-[#2B39C7]" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-3xl hover:bg-gray-50">
            Cancel
          </button>
          <button disabled={!form.name || loading} onClick={handleSubmit}
            className="px-5 py-2 text-sm font-medium bg-[#2B39C7] text-white rounded-3xl hover:bg-[#2B39C7] disabled:opacity-50 transition-colors">
            {loading ? 'Creating…' : 'Create Zone'}
          </button>
        </div>
      </div>
    </div>
  )
}
