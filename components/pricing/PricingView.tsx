'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs } from '@/components/ui/Tabs'
import { formatTZS } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import type { PricingRule, AdminRole } from '@/lib/types'

const TABS = [
  { key: 'active', label: 'Active Rules' },
  { key: 'history', label: 'Pricing History' },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function PricingView({
  activeRules, historyRules, zones, tab, adminRole,
}: {
  activeRules: PricingRule[]
  historyRules: PricingRule[]
  zones: Array<{ id: string; name: string }>
  tab: string
  adminRole: AdminRole
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [createModal, setCreateModal] = useState(false)
  const canWrite = ['super_admin', 'ops_admin'].includes(adminRole)

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k) })
    router.push(`/pricing?${params.toString()}`)
  }

  async function deactivateRule(id: string) {
    if (!confirm('Deactivate this pricing rule? This cannot be undone. Existing rides are unaffected.')) return
    await fetch(`/api/pricing/rules/${id}/deactivate`, { method: 'POST' })
    router.refresh()
  }

  const rules = tab === 'active' ? activeRules : historyRules

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 pt-4 flex items-center justify-between">
        <Tabs tabs={TABS} active={tab} onChange={key => navigate({ tab: key })} />
        {canWrite && tab === 'active' && (
          <button
            onClick={() => setCreateModal(true)}
            className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + New Rule
          </button>
        )}
      </div>

      {/* Immutability notice */}
      <div className="px-5 py-2 bg-amber-50 border-b border-amber-100">
        <p className="text-xs text-amber-700">
          Pricing changes only apply to future rides. Past rides retain their original pricing rule snapshot.
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {rules.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No pricing rules found</p>
        ) : rules.map(rule => (
          <div key={rule.id} className="px-5 py-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-900">{rule.name}</span>
                <span className="text-xs text-gray-400 capitalize">
                  {rule.vehicle_type ?? 'All vehicles'}
                </span>
                {rule.zone_id && (
                  <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                    Zone: {(rule.zones as { name: string } | null)?.name}
                  </span>
                )}
                <span className="text-xs text-gray-400">Priority: {rule.priority}</span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-xs text-gray-600 mt-2">
                <div>
                  <span className="text-gray-400">Base Fare</span>
                  <p className="font-medium">{formatTZS(rule.base_fare_tzs)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Per KM</span>
                  <p className="font-medium">{formatTZS(rule.per_km_rate_tzs)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Per Min</span>
                  <p className="font-medium">{formatTZS(rule.per_minute_rate)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Min Fare</span>
                  <p className="font-medium">{rule.minimum_fare_tzs ? formatTZS(rule.minimum_fare_tzs) : '—'}</p>
                </div>
              </div>
              {rule.peak_multiplier > 1 && (
                <p className="text-xs text-orange-600 mt-1">
                  Peak ×{rule.peak_multiplier} — {rule.peak_start_time} to {rule.peak_end_time}
                  {rule.peak_days?.length ? ` (${rule.peak_days.map(d => DAYS[d]).join(', ')})` : ''}
                </p>
              )}
            </div>
            {canWrite && tab === 'active' && (
              <button
                onClick={() => deactivateRule(rule.id)}
                className="text-xs text-red-600 hover:text-red-800 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 shrink-0"
              >
                Deactivate
              </button>
            )}
            {tab === 'history' && (
              <span className="text-xs text-gray-400 shrink-0">Inactive</span>
            )}
          </div>
        ))}
      </div>

      <CreatePricingRuleModal
        open={createModal}
        onClose={() => { setCreateModal(false); router.refresh() }}
        zones={zones}
      />
    </div>
  )
}

function CreatePricingRuleModal({
  open, onClose, zones,
}: {
  open: boolean
  onClose: () => void
  zones: Array<{ id: string; name: string }>
}) {
  const [form, setForm] = useState({
    name: '', vehicle_type: '', zone_id: '',
    base_fare_tzs: '', per_km_rate_tzs: '', per_minute_rate: '0',
    minimum_fare_tzs: '', peak_multiplier: '1.0',
    peak_start_time: '', peak_end_time: '', priority: '0',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pricing/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          vehicle_type: form.vehicle_type || null,
          zone_id: form.zone_id || null,
          base_fare_tzs: Number(form.base_fare_tzs),
          per_km_rate_tzs: Number(form.per_km_rate_tzs),
          per_minute_rate: Number(form.per_minute_rate),
          minimum_fare_tzs: form.minimum_fare_tzs ? Number(form.minimum_fare_tzs) : null,
          peak_multiplier: Number(form.peak_multiplier),
          peak_start_time: form.peak_start_time || null,
          peak_end_time: form.peak_end_time || null,
          priority: Number(form.priority),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create rule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Pricing Rule"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            disabled={!form.name || !form.base_fare_tzs || !form.per_km_rate_tzs || loading}
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Rule'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Rule Name</label>
          <input value={form.name} onChange={f('name')} placeholder="e.g. Kinondoni Bajaj Peak"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Type</label>
          <select value={form.vehicle_type} onChange={f('vehicle_type')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Vehicles</option>
            <option value="bodaboda">Bodaboda</option>
            <option value="bajaj">Bajaj</option>
            <option value="car">Car</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Zone</label>
          <select value={form.zone_id} onChange={f('zone_id')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Zones</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>
        {[
          { label: 'Base Fare (TZS)', field: 'base_fare_tzs', ph: '1000' },
          { label: 'Per KM Rate (TZS)', field: 'per_km_rate_tzs', ph: '500' },
          { label: 'Per Minute Rate (TZS)', field: 'per_minute_rate', ph: '10' },
          { label: 'Minimum Fare (TZS)', field: 'minimum_fare_tzs', ph: '1500' },
          { label: 'Peak Multiplier', field: 'peak_multiplier', ph: '1.5' },
          { label: 'Priority', field: 'priority', ph: '0' },
          { label: 'Peak Start Time', field: 'peak_start_time', ph: '07:00' },
          { label: 'Peak End Time', field: 'peak_end_time', ph: '09:00' },
        ].map(({ label, field, ph }) => (
          <div key={field}>
            <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
            <input value={form[field as keyof typeof form]} onChange={f(field)} placeholder={ph}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        ))}
        {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
