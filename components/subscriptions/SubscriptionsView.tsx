'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { SubscriptionBadge, PaymentStatusBadge } from '@/components/ui/Badge'
import { formatDate, formatTZS } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import type { DriverSubscription, SubscriptionPayment, SubscriptionPlan } from '@/lib/types'
import type { CommissionRide } from '@/lib/queries/commissions'

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_SUBS = [
  { id: 's1', driver_id: 'd1', plan_id: 'p1', status: 'active',   started_at: '2026-03-01T00:00:00Z', expires_at: '2026-04-08T00:00:00Z', rides_remaining: 40,  drivers: { full_name: 'John Mawella',    driver_number: 'DRV-000001', phone: '0712 345 678' }, subscription_plans: { name: 'Weekly Standard' } },
  { id: 's2', driver_id: 'd2', plan_id: 'p2', status: 'active',   started_at: '2026-03-15T00:00:00Z', expires_at: '2026-04-15T00:00:00Z', rides_remaining: null, drivers: { full_name: "Liam O'Connor",   driver_number: 'DRV-000003', phone: '0765 432 109' }, subscription_plans: { name: 'Monthly Unlimited' } },
  { id: 's3', driver_id: 'd3', plan_id: 'p1', status: 'expired',  started_at: '2026-02-01T00:00:00Z', expires_at: '2026-03-01T00:00:00Z', rides_remaining: 0,   drivers: { full_name: 'Asha Kassim',     driver_number: 'DRV-000002', phone: '0754 221 990' }, subscription_plans: { name: 'Weekly Standard' } },
  { id: 's4', driver_id: 'd4', plan_id: 'p1', status: 'active',   started_at: '2026-03-20T00:00:00Z', expires_at: '2026-04-20T00:00:00Z', rides_remaining: 55,  drivers: { full_name: 'Sofia Lee',       driver_number: 'DRV-000004', phone: '0789 654 321' }, subscription_plans: { name: 'Weekly Standard' } },
  { id: 's5', driver_id: 'd5', plan_id: 'p2', status: 'expired',  started_at: '2026-01-15T00:00:00Z', expires_at: '2026-02-15T00:00:00Z', rides_remaining: 0,   drivers: { full_name: 'Maya Patel',      driver_number: 'DRV-000005', phone: '0798 876 543' }, subscription_plans: { name: 'Monthly Unlimited' } },
  { id: 's6', driver_id: 'd6', plan_id: 'p1', status: 'active',   started_at: '2026-03-25T00:00:00Z', expires_at: '2026-04-25T00:00:00Z', rides_remaining: 60,  drivers: { full_name: 'Ethan Wright',    driver_number: 'DRV-000006', phone: '0800 123 456' }, subscription_plans: { name: 'Weekly Standard' } },
  { id: 's7', driver_id: 'd7', plan_id: 'p2', status: 'expired',  started_at: '2026-02-10T00:00:00Z', expires_at: '2026-03-10T00:00:00Z', rides_remaining: 0,   drivers: { full_name: 'Olivia Martinez', driver_number: 'DRV-000007', phone: '0822 345 678' }, subscription_plans: { name: 'Monthly Unlimited' } },
  { id: 's8', driver_id: 'd8', plan_id: 'p1', status: 'active',   started_at: '2026-04-01T00:00:00Z', expires_at: '2026-04-30T00:00:00Z', rides_remaining: 70,  drivers: { full_name: 'Noah Smith',      driver_number: 'DRV-000008', phone: '0843 987 654' }, subscription_plans: { name: 'Weekly Standard' } },
]

const MOCK_PAYMENTS = [
  { id: 'py1', driver_id: 'd3', subscription_id: 's3', plan_id: 'p1', amount_tzs: 15000, payment_method: 'mobile_money', provider: 'M-Pesa', status: 'failed',    created_at: '2026-03-01T09:00:00Z', drivers: { full_name: 'Asha Kassim' },     subscription_plans: { name: 'Weekly Standard' } },
  { id: 'py2', driver_id: 'd5', subscription_id: 's5', plan_id: 'p2', amount_tzs: 45000, payment_method: 'mobile_money', provider: 'Tigo',   status: 'failed',    created_at: '2026-02-15T14:30:00Z', drivers: { full_name: 'Maya Patel' },      subscription_plans: { name: 'Monthly Unlimited' } },
  { id: 'py3', driver_id: 'd1', subscription_id: 's1', plan_id: 'p1', amount_tzs: 15000, payment_method: 'mobile_money', provider: 'M-Pesa', status: 'completed', created_at: '2026-03-01T08:00:00Z', drivers: { full_name: 'John Mawella' },    subscription_plans: { name: 'Weekly Standard' } },
  { id: 'py4', driver_id: 'd2', subscription_id: 's2', plan_id: 'p2', amount_tzs: 45000, payment_method: 'mobile_money', provider: 'Airtel', status: 'completed', created_at: '2026-03-15T10:00:00Z', drivers: { full_name: "Liam O'Connor" },   subscription_plans: { name: 'Monthly Unlimited' } },
  { id: 'py5', driver_id: 'd6', subscription_id: 's6', plan_id: 'p1', amount_tzs: 15000, payment_method: 'mobile_money', provider: 'M-Pesa', status: 'completed', created_at: '2026-03-25T11:00:00Z', drivers: { full_name: 'Ethan Wright' },    subscription_plans: { name: 'Weekly Standard' } },
  { id: 'py6', driver_id: 'd7', subscription_id: 's7', plan_id: 'p2', amount_tzs: 45000, payment_method: 'mobile_money', provider: 'Tigo',   status: 'failed',    created_at: '2026-02-10T09:30:00Z', drivers: { full_name: 'Olivia Martinez' }, subscription_plans: { name: 'Monthly Unlimited' } },
]

const MOCK_PLANS: SubscriptionPlan[] = [
  { id: 'p1', name: 'Weekly Standard',   duration_days: 7,  price_tzs: 15000, vehicle_types: ['bodaboda', 'bajaj', 'car'], description: 'Perfect for weekly commuters',    is_active: true,  created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'p2', name: 'Monthly Unlimited', duration_days: 30, price_tzs: 45000, vehicle_types: ['bodaboda', 'bajaj', 'car'], description: 'Best value for full-time drivers', is_active: true,  created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'p3', name: 'Daily Pass',        duration_days: 1,  price_tzs: 3000,  vehicle_types: ['bodaboda'],                 description: 'One-day access pass',             is_active: false, created_at: '2024-03-01T00:00:00Z', updated_at: '2024-03-01T00:00:00Z' },
]

const MOCK_COMMISSIONS: CommissionRide[] = [
  { id: 'r1', ride_number: 'RDE-000101', vehicle_type: 'bodaboda', total_fare_tzs: 12000, commission_rate: 0.20, commission_tzs: 2400,  driver_earnings_tzs: 9600,  completed_at: '2026-04-08T10:30:00Z', drivers: { full_name: 'Ali Hassan',      driver_number: 'DRV-000012', phone: '0712 111 222' } },
  { id: 'r2', ride_number: 'RDE-000102', vehicle_type: 'bajaj',    total_fare_tzs: 18000, commission_rate: 0.20, commission_tzs: 3600,  driver_earnings_tzs: 14400, completed_at: '2026-04-08T09:15:00Z', drivers: { full_name: 'Fatuma Salim',    driver_number: 'DRV-000015', phone: '0754 333 444' } },
  { id: 'r3', ride_number: 'RDE-000103', vehicle_type: 'car',      total_fare_tzs: 35000, commission_rate: 0.20, commission_tzs: 7000,  driver_earnings_tzs: 28000, completed_at: '2026-04-07T16:45:00Z', drivers: { full_name: 'James Mwangi',    driver_number: 'DRV-000009', phone: '0789 555 666' } },
  { id: 'r4', ride_number: 'RDE-000104', vehicle_type: 'bodaboda', total_fare_tzs: 8500,  commission_rate: 0.20, commission_tzs: 1700,  driver_earnings_tzs: 6800,  completed_at: '2026-04-07T14:20:00Z', drivers: { full_name: 'Grace Odhiambo', driver_number: 'DRV-000021', phone: '0798 777 888' } },
  { id: 'r5', ride_number: 'RDE-000105', vehicle_type: 'bajaj',    total_fare_tzs: 22000, commission_rate: 0.20, commission_tzs: 4400,  driver_earnings_tzs: 17600, completed_at: '2026-04-06T11:00:00Z', drivers: { full_name: 'Moses Kariuki',   driver_number: 'DRV-000033', phone: '0765 999 000' } },
  { id: 'r6', ride_number: 'RDE-000106', vehicle_type: 'car',      total_fare_tzs: 48000, commission_rate: 0.20, commission_tzs: 9600,  driver_earnings_tzs: 38400, completed_at: '2026-04-06T08:30:00Z', drivers: { full_name: 'Sarah Mutua',     driver_number: 'DRV-000041', phone: '0800 112 233' } },
]

const MOCK_SUBS_BY_TAB: Record<string, typeof MOCK_SUBS> = {
  active:          MOCK_SUBS.filter(s => s.status === 'active'),
  expired:         MOCK_SUBS.filter(s => s.status === 'expired'),
  failed:          [],
  payment_history: [],
  commissions:     [],
}

const MOCK_PAYMENTS_BY_TAB: Record<string, typeof MOCK_PAYMENTS> = {
  failed:          MOCK_PAYMENTS.filter(p => p.status === 'failed'),
  payment_history: MOCK_PAYMENTS,
}

export function SubscriptionsView({
  subscriptions, subsTotal, plans, payments, paymentsTotal,
  commissions, commissionsTotal, commissionStats,
  tab, page, useMock,
}: {
  subscriptions: DriverSubscription[]
  subsTotal: number
  plans: SubscriptionPlan[]
  payments: SubscriptionPayment[]
  paymentsTotal: number
  commissions: CommissionRide[]
  commissionsTotal: number
  commissionStats: { monthRevenue: number; todayRevenue: number; totalRides: number }
  tab: string
  page: number
  useMock?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [planModal, setPlanModal] = useState(false)

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k) })
    router.push(`/subscriptions?${params.toString()}`)
  }

  // ── Column definitions ─────────────────────────────────────────────────────

  const subColumns = [
    {
      key: 'driver', label: 'Driver',
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
      key: 'plan', label: 'Plan',
      render: (row: Record<string, unknown>) => {
        const s = row as unknown as DriverSubscription & { subscription_plans: { name: string } }
        return <span className="text-sm text-gray-700">{s.subscription_plans?.name ?? '—'}</span>
      },
    },
    {
      key: 'status', label: 'Status',
      render: (row: Record<string, unknown>) => <SubscriptionBadge status={(row as unknown as DriverSubscription).status} />,
    },
    {
      key: 'started_at', label: 'Started',
      render: (row: Record<string, unknown>) => formatDate((row as unknown as DriverSubscription).started_at),
    },
    {
      key: 'expires_at', label: 'Expires',
      render: (row: Record<string, unknown>) => formatDate((row as unknown as DriverSubscription).expires_at),
    },
    {
      key: 'rides_remaining', label: 'Rides Left',
      render: (row: Record<string, unknown>) => {
        const r = (row as unknown as DriverSubscription).rides_remaining
        return r != null ? String(r) : <span className="text-gray-400 text-xs">Unlimited</span>
      },
    },
  ]

  const paymentColumns = [
    {
      key: 'driver', label: 'Driver',
      render: (row: Record<string, unknown>) => {
        const p = row as unknown as SubscriptionPayment & { drivers: { full_name: string } }
        return <span className="font-medium text-[#1d242d]">{p.drivers?.full_name ?? '—'}</span>
      },
    },
    {
      key: 'plan', label: 'Plan',
      render: (row: Record<string, unknown>) => {
        const p = row as unknown as SubscriptionPayment & { subscription_plans: { name: string } }
        return <span className="text-[#1d242d]">{p.subscription_plans?.name ?? '—'}</span>
      },
    },
    { key: 'amount_tzs', label: 'Amount',   render: (row: Record<string, unknown>) => formatTZS((row as unknown as SubscriptionPayment).amount_tzs) },
    { key: 'provider',   label: 'Provider', render: (row: Record<string, unknown>) => (row as unknown as SubscriptionPayment).provider ?? '—' },
    {
      key: 'status', label: 'Status',
      render: (row: Record<string, unknown>) => <PaymentStatusBadge status={(row as unknown as SubscriptionPayment).status} />,
    },
    { key: 'created_at', label: 'Date', render: (row: Record<string, unknown>) => formatDate((row as unknown as SubscriptionPayment).created_at) },
  ]

  const VEHICLE_LABELS: Record<string, string> = { bodaboda: 'Bodaboda', bajaj: 'Bajaj', car: 'Car' }

  const commissionColumns = [
    {
      key: 'driver', label: 'Driver',
      render: (row: Record<string, unknown>) => {
        const r = row as unknown as CommissionRide
        return r.drivers ? (
          <div>
            <p className="text-sm font-medium text-[#1d242d]">{r.drivers.full_name}</p>
            <p className="text-xs text-gray-400">{r.drivers.driver_number}</p>
          </div>
        ) : <span className="text-gray-400">—</span>
      },
    },
    {
      key: 'ride_number', label: 'Ride',
      render: (row: Record<string, unknown>) => {
        const r = row as unknown as CommissionRide
        return <span className="text-sm font-mono text-gray-600">{r.ride_number}</span>
      },
    },
    {
      key: 'vehicle_type', label: 'Vehicle',
      render: (row: Record<string, unknown>) => {
        const r = row as unknown as CommissionRide
        return <span className="text-sm text-gray-600">{VEHICLE_LABELS[r.vehicle_type] ?? r.vehicle_type}</span>
      },
    },
    {
      key: 'total_fare_tzs', label: 'Ride Fare',
      render: (row: Record<string, unknown>) => {
        const r = row as unknown as CommissionRide
        return <span className="text-sm text-[#1d242d]">{formatTZS(r.total_fare_tzs ?? 0)}</span>
      },
    },
    {
      key: 'commission_rate', label: 'Rate',
      render: (row: Record<string, unknown>) => {
        const r = row as unknown as CommissionRide
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EEF0FD] text-[#2B39C7]">
            {Math.round(r.commission_rate * 100)}%
          </span>
        )
      },
    },
    {
      key: 'commission_tzs', label: 'Commission',
      render: (row: Record<string, unknown>) => {
        const r = row as unknown as CommissionRide
        return (
          <span className="text-sm font-semibold text-green-700">
            {formatTZS(r.commission_tzs)}
          </span>
        )
      },
    },
    {
      key: 'driver_earnings_tzs', label: 'Driver Earned',
      render: (row: Record<string, unknown>) => {
        const r = row as unknown as CommissionRide
        return <span className="text-sm text-gray-500">{formatTZS(r.driver_earnings_tzs ?? 0)}</span>
      },
    },
    {
      key: 'completed_at', label: 'Date',
      render: (row: Record<string, unknown>) => {
        const r = row as unknown as CommissionRide
        return <span className="text-sm text-gray-500">{r.completed_at ? formatDate(r.completed_at) : '—'}</span>
      },
    },
  ]

  // ── Data resolution (real vs mock) ─────────────────────────────────────────

  const CARD_TITLES: Record<string, string> = {
    active: 'Active Subscriptions', expired: 'Expired Subscriptions',
    failed: 'Failed Payments', plans: 'Plans & Pricing',
    payment_history: 'Payment History', commissions: 'Commission Revenue',
  }

  const displaySubs        = (useMock ? (MOCK_SUBS_BY_TAB[tab]     ?? MOCK_SUBS)     : subscriptions)  as unknown as DriverSubscription[]
  const displaySubTotal    = useMock ? displaySubs.length : subsTotal
  const displayPayments    = (useMock ? (MOCK_PAYMENTS_BY_TAB[tab] ?? MOCK_PAYMENTS) : payments)       as unknown as SubscriptionPayment[]
  const displayPayTotal    = useMock ? displayPayments.length : paymentsTotal
  const displayPlans       = (useMock && plans.length === 0) ? MOCK_PLANS : plans
  const displayCommissions = (useMock && commissions.length === 0) ? MOCK_COMMISSIONS : commissions
  const displayCommTotal   = useMock && commissions.length === 0 ? MOCK_COMMISSIONS.length : commissionsTotal

  // ── Commission summary bar ─────────────────────────────────────────────────

  const showCommStats = useMock || commissionStats.totalRides > 0

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">

      {tab === 'commissions' ? (
        <div>
          {/* Summary bar */}
          {showCommStats && (
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
              {[
                { label: 'This Month',   value: useMock ? 'TZS 28,700' : formatTZS(commissionStats.monthRevenue) },
                { label: 'Today',        value: useMock ? 'TZS 2,400'  : formatTZS(commissionStats.todayRevenue) },
                { label: 'Total Rides',  value: useMock ? '6'          : String(commissionStats.totalRides) },
              ].map(({ label, value }) => (
                <div key={label} className="px-6 py-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-mono mb-1">{label}</p>
                  <p className="text-lg font-semibold text-[#1d242d]">{value}</p>
                </div>
              ))}
            </div>
          )}
          <DataTable
            columns={commissionColumns}
            data={displayCommissions as unknown as Record<string, unknown>[]}
            cardTitle="Commission Revenue"
          />
          <Pagination
            page={page}
            total={displayCommTotal}
            perPage={20}
            onPageChange={p => navigate({ page: String(p) })}
          />
        </div>

      ) : tab === 'plans' ? (
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <span className="text-base font-medium text-[#1d242d] tracking-[-0.5px]">Plans & Pricing</span>
            <button
              onClick={() => setPlanModal(true)}
              className="px-4 py-2 text-sm font-medium bg-[#2B39C7] text-white rounded-lg hover:bg-[#202b95]"
            >
              + New Plan
            </button>
          </div>
          <PlansTable plans={displayPlans} />
        </div>

      ) : tab === 'payment_history' || tab === 'failed' ? (
        <>
          <DataTable columns={paymentColumns} data={displayPayments as unknown as Record<string, unknown>[]} cardTitle={CARD_TITLES[tab]} selectable />
          <Pagination page={page} total={displayPayTotal} perPage={20} onPageChange={p => navigate({ page: String(p) })} />
        </>

      ) : (
        <>
          <DataTable columns={subColumns} data={displaySubs as unknown as Record<string, unknown>[]} cardTitle={CARD_TITLES[tab] ?? 'Subscriptions'} selectable />
          <Pagination page={page} total={displaySubTotal} perPage={20} onPageChange={p => navigate({ page: String(p) })} />
        </>
      )}

      <CreatePlanModal open={planModal} onClose={() => { setPlanModal(false); router.refresh() }} />
    </div>
  )
}

// ── Plans table ───────────────────────────────────────────────────────────────

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

// ── Create plan modal ─────────────────────────────────────────────────────────

function CreatePlanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', duration_days: '7', price_tzs: '', description: '' })
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
            className="px-4 py-2 text-sm bg-[#2B39C7] text-white rounded-lg hover:bg-[#202b95] disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Plan'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {[
          { label: 'Plan Name',        field: 'name',         placeholder: 'e.g. Weekly Standard' },
          { label: 'Duration (days)',  field: 'duration_days', placeholder: '7' },
          { label: 'Price (TZS)',      field: 'price_tzs',    placeholder: '15000' },
        ].map(({ label, field, placeholder }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              value={form[field as keyof typeof form]}
              onChange={f(field)}
              placeholder={placeholder}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B39C7]/30"
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={f('description')}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B39C7]/30"
          />
        </div>
      </div>
    </Modal>
  )
}
