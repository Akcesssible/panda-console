import Image from 'next/image'
import { formatTZS, formatDate, formatDateTime } from '@/lib/utils'
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

  return (
    <div className="bg-gradient-to-br from-[#2B39C7] to-[#1a2499] rounded-2xl overflow-hidden relative flex flex-col justify-between min-h-[220px] p-5">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-2xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
      </div>

      {/* Top row */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-white text-[11px] font-medium">
            {activeSub ? 'Active' : 'No Plan'}
          </span>
        </div>
        <div className="text-right">
          <p className="text-white/60 text-[10px]">panda</p>
          <p className="text-white/60 text-[10px]">Subscription</p>
        </div>
      </div>

      {/* Big rides remaining */}
      <div className="relative z-10 mt-4">
        <p className="text-5xl font-semibold text-white tracking-[-2px] leading-none">
          {activeSub?.rides_remaining ?? 0}
        </p>
        <p className="text-white/70 text-sm mt-1">Rides Remaining</p>
      </div>

      {/* Bottom info */}
      <div className="relative z-10 mt-4 space-y-1">
        {lastPayment && (
          <>
            <div className="flex justify-between">
              <span className="text-white/60 text-xs">Amount Paid</span>
              <span className="text-white text-xs font-medium">{formatTZS(lastPayment.amount_tzs)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60 text-xs">Last Purchased</span>
              <span className="text-white text-xs font-medium">
                {lastPayment.paid_at ? formatDateTime(lastPayment.paid_at) : '—'}
              </span>
            </div>
          </>
        )}
        {activeSub && (
          <div className="flex justify-between">
            <span className="text-white/60 text-xs">Expires</span>
            <span className="text-white text-xs font-medium">{formatDate(activeSub.expires_at)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
