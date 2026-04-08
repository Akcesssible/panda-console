import { SubscriptionBadge } from '@/components/ui/Badge'
import { formatDate, formatTZS } from '@/lib/utils'
import type { Driver, DriverSubscription, SubscriptionPlan } from '@/lib/types'

export function DriverSubscriptionCard({ driver }: { driver: Driver }) {
  const subscriptions = driver.driver_subscriptions as (DriverSubscription & { subscription_plans: SubscriptionPlan })[] | undefined
  const activeSub = subscriptions?.find(s => s.status === 'active' || s.status === 'grace_period')

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Subscription</h2>

      {activeSub ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-900">
              {activeSub.subscription_plans?.name ?? 'Plan'}
            </span>
            <SubscriptionBadge status={activeSub.status} />
          </div>
          <div className="space-y-2 text-sm">
            <InfoRow label="Started" value={formatDate(activeSub.started_at)} />
            <InfoRow label="Expires" value={formatDate(activeSub.expires_at)} />
            {activeSub.rides_remaining !== null && (
              <InfoRow label="Rides Remaining" value={String(activeSub.rides_remaining)} />
            )}
            <InfoRow
              label="Commission Rate"
              value="0% — Subscriber"
            />
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            Price: {formatTZS(activeSub.subscription_plans?.price_tzs ?? 0)}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-2">No active subscription</p>
          <p className="text-xs text-gray-400">
            Standard commission rate applies to all rides.
          </p>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  )
}
