import type { DriverSubscription, SubscriptionPayment, SubscriptionPlan } from '@/lib/types'
import { api } from '@/lib/api/client'
import { paths } from '@/lib/api/paths'
import { toPlan } from '@/lib/api/adapters'
import type { PlanResponse } from '@/lib/api/types'

export async function getSubscriptions(_params: {
  status?: string
  driverId?: string
  page?: number
}): Promise<{ subscriptions: DriverSubscription[]; total: number }> {
  return { subscriptions: [], total: 0 }
}

// Plans are owned by the backend (subscription-service). GET /api/v1/subscriptions/plans
// returns the full catalogue (admin-only). The adapter fills UI-only fields
// (duration_days, vehicle_types) that the backend plan model lacks.
export async function getPlans(): Promise<SubscriptionPlan[]> {
  const plans = await api.get<PlanResponse[]>(paths.subscriptionPlans)
  return (plans ?? [])
    .map(toPlan)
    .sort((a, b) => a.price_tzs - b.price_tzs)
}

export async function getPayments(_params: {
  status?: string
  page?: number
}): Promise<{ payments: SubscriptionPayment[]; total: number }> {
  return { payments: [], total: 0 }
}
