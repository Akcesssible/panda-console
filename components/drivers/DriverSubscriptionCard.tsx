import Image from 'next/image'
import { formatTZS, formatDateTime } from '@/lib/utils'
import type { Driver, DriverSubscription, SubscriptionPlan } from '@/lib/types'

interface LastPayment {
  amount_tzs: number
  paid_at: string | null
  status: string
}

interface Props {
  driver: Driver
  lastPayment: LastPayment | null
}

export function DriverSubscriptionCard({ driver, lastPayment }: Props) {
  const subscriptions = driver.driver_subscriptions as (DriverSubscription & { subscription_plans: SubscriptionPlan })[] | undefined
  const activeSub = subscriptions?.find(s => s.status === 'active' || s.status === 'grace_period')
  const isActive = !!activeSub

  return (
    <div className="relative bg-gradient-to-br from-[#4155E0] via-[#3547D9] to-[#1e2fb5] rounded-2xl overflow-hidden flex flex-col justify-between h-full min-h-[220px] p-5">

      {/* Subtle glow blob */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10 blur-3xl" />

      {/* ── Top row ── */}
      <div className="relative z-10 flex items-start justify-between">
        {/* Status pill */}
        <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
          isActive
            ? 'bg-green-400 text-white'
            : 'bg-white/15 text-white/70'
        }`}>
          {isActive ? 'Active' : 'No Plan'}
        </span>

        {/* Panda logo */}
        <Image
          src="/panda-logo_subs.svg"
          alt="Panda Subscription"
          width={72}
          height={36}
          className="opacity-95"
        />
      </div>

      {/* ── Bottom row ── */}
      <div className="relative z-10 flex items-end justify-between gap-4 mt-6">
        {/* Left — big number */}
        <div>
          <p className="text-6xl font-bold text-white tracking-[-3px] leading-none">
            {activeSub?.rides_remaining ?? 0}
          </p>
          <p className="text-white/60 text-sm mt-2">Rides Remaining</p>
        </div>

        {/* Right — payment info stacked, right-aligned */}
        <div className="text-right space-y-2 shrink-0">
          {lastPayment ? (
            <>
              <div>
                <p className="text-white text-sm font-semibold">{formatTZS(lastPayment.amount_tzs)}</p>
                <p className="text-white/50 text-xs">Amount Paid</p>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">
                  {lastPayment.paid_at ? formatDateTime(lastPayment.paid_at) : '—'}
                </p>
                <p className="text-white/50 text-xs">Last Purchased</p>
              </div>
            </>
          ) : (
            <p className="text-white/40 text-xs">No payment history</p>
          )}
        </div>
      </div>
    </div>
  )
}
