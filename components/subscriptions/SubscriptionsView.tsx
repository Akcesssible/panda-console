'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs } from '@/components/ui/Tabs'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { SubscriptionBadge, PaymentStatusBadge } from '@/components/ui/Badge'
import { formatDate, formatTZS } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import type { DriverSubscription, SubscriptionPayment, SubscriptionPlan } from '@/lib/types'

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'expired', label: 'Expired' },
  { key: 'failed', label: 'Failed Payments' },
  { key: 'plans', label: 'Plans & Pricing' },
  { key: 'payment_history', label: 'Payment History' },
]

export function SubscriptionsView({
  subscriptions, subsTotal, plans, payments, paymentsTotal, tab, page,
}: {
  subscriptions: DriverSubscription[]
  subsTotal: number
  plans: SubscriptionPlan[]
  payments: SubscriptionPayment[]
  paymentsTotal: number
  tab: string
  page: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [planModal, setPlanModal] = useState(false)

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k) })
    router.push(`/subscriptions?${params.toString()}`)
  }

  const subColumns = [
    {
      key: 'driver',
      label: 'Driver',
      render: (row: Record<string, unknown>) => {
        const s = row as unknown as DriverSubscription & { drivers: { full_name: string; driver_number: string; phone: string } }
        return s.drivers ? (
          <div>
            <p className="text-sm font-medium text-gray-900">{s.drivers.full_name}</p>
            <p className="text-xs text-gray-400">{s.drivers.driver_number}</p>
          </div>
        ) : <span className="text-gray-400">—</span>
      },
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (row: Record<string, unknown>) => {
        const s = row as unknown as DriverSubscription & { subscription_plans: { name: string } }
        return <span className="text-sm text-gray-700">{s.subscription_plans?.name ?? '—'}</span>
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Record<string, unknown>) => <SubscriptionBadge status={(row as unknown as DriverSubscription).status} />,
    },
    {
      key: 'started_at',
      label: 'Started',
      render: (row: Record<string, unknown>) => formatDate((row as unknown as DriverSubscription).started_at),
    },
    {
      key: 'expires_at',
      label: 'Expires',
      render: (row: Record<string, unknown>) => formatDate((row as unknown as DriverSubscription).expires_at),
    },
    {
      key: 'rides_remaining',
      label: 'Rides Left',
      render: (row: Record<string, unknown>) => {
        const r = (row as unknown as DriverSubscription).rides_remaining
        return r != null ? String(r) : <span className="text-gray-400 text-xs">Unlimited</span>
      },
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 pt-4 flex items-center justify-between">
        <Tabs tabs={TABS} active={tab} onChange={key => navigate({ tab: key, page: '1' })} />
        {tab === 'plans' && (
          <button
            onClick={() => setPlanModal(true)}
            className="px-3 py-1.5 text-sm font-medium bg-primary$ text-white rounded-lg hover:bg-primary-dark$"
          >
            + New Plan
          </button>
        )}
      </div>

      {tab === 'plans' ? (
        <PlansTable plans={plans} />
      ) : tab === 'payment_history' || tab === 'failed' ? (
        <>
          <DataTable
            columns={[
              {
                key: 'driver',
                label: 'Driver',
                render: (row: Record<string, unknown>) => {
                  const p = row as unknown as SubscriptionPayment & { drivers: { full_name: string } }
                  return p.drivers?.full_name ?? '—'
                },
              },
              {
                key: 'plan',
                label: 'Plan',
                render: (row: Record<string, unknown>) => {
                  const p = row as unknown as SubscriptionPayment & { subscription_plans: { name: string } }
                  return p.subscription_plans?.name ?? '—'
                },
              },
              {
                key: 'amount_tzs',
                label: 'Amount',
                render: (row: Record<string, unknown>) => formatTZS((row as unknown as SubscriptionPayment).amount_tzs),
              },
              {
                key: 'provider',
                label: 'Provider',
                render: (row: Record<string, unknown>) => (row as unknown as SubscriptionPayment).provider ?? '—',
              },
              {
                key: 'status',
                label: 'Status',
                render: (row: Record<string, unknown>) => <PaymentStatusBadge status={(row as unknown as SubscriptionPayment).status} />,
              },
              {
                key: 'created_at',
                label: 'Date',
                render: (row: Record<string, unknown>) => formatDate((row as unknown as SubscriptionPayment).created_at),
              },
            ]}
            data={payments}
          />
          <Pagination page={page} total={paymentsTotal} perPage={20} onPageChange={p => navigate({ page: String(p) })} />
        </>
      ) : (
        <>
          <DataTable columns={subColumns} data={subscriptions} />
          <Pagination page={page} total={subsTotal} perPage={20} onPageChange={p => navigate({ page: String(p) })} />
        </>
      )}

      <CreatePlanModal open={planModal} onClose={() => { setPlanModal(false); router.refresh() }} />
    </div>
  )
}

function PlansTable({ plans }: { plans: SubscriptionPlan[] }) {
  return (
    <div className="divide-y divide-gray-100">
      {plans.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No plans configured</p>
      ) : plans.map(plan => (
        <div key={plan.id} className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{plan.name}</p>
            <p className="text-xs text-gray-500">{plan.duration_days} days · {plan.vehicle_types.join(', ')}</p>
            {plan.description && <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{formatTZS(plan.price_tzs)}</p>
            <span className={`text-xs ${plan.is_active ? 'text-green-600' : 'text-red-500'}`}>
              {plan.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function CreatePlanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    name: '', duration_days: '7', price_tzs: '', description: '',
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    await fetch('/api/subscriptions/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        duration_days: Number(form.duration_days),
        price_tzs: Number(form.price_tzs),
        vehicle_types: ['bodaboda', 'bajaj', 'car'],
      }),
    })
    setLoading(false)
    onClose()
  }

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Subscription Plan"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            disabled={!form.name || !form.price_tzs || loading}
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-primary$ text-white rounded-lg hover:bg-primary-dark$ disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Plan'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {[
          { label: 'Plan Name', field: 'name', placeholder: 'e.g. Weekly Standard' },
          { label: 'Duration (days)', field: 'duration_days', placeholder: '7' },
          { label: 'Price (TZS)', field: 'price_tzs', placeholder: '15000' },
        ].map(({ label, field, placeholder }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              value={form[field as keyof typeof form]}
              onChange={f(field)}
              placeholder={placeholder}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary$"
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={f('description')}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary$"
          />
        </div>
      </div>
    </Modal>
  )
}
