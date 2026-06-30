import type { SubscriptionPlan, VehicleType } from '@/lib/types'
import type { PlanResponse, CreatePlanBody } from '@/lib/api/types'

// All vehicle types — the backend plan catalogue is not segmented by vehicle,
// so every plan applies to all of them.
const ALL_VEHICLE_TYPES: VehicleType[] = ['bodaboda', 'bajaj', 'car']

// Backend plans are billed monthly; the UI models duration in days.
const MONTHLY_DURATION_DAYS = 30

// PlanResponse (backend) → SubscriptionPlan (UI).
// duration_days and vehicle_types have no backend equivalent and are filled
// with defaults so the existing UI keeps rendering. (Backend gap to revisit.)
export function toPlan(p: PlanResponse): SubscriptionPlan {
  return {
    id: p.id,
    name: p.name,
    price_tzs: Number(p.monthlyFee),
    duration_days: MONTHLY_DURATION_DAYS,
    vehicle_types: ALL_VEHICLE_TYPES,
    description: p.description,
    is_active: p.active,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  }
}

// UI create payload → CreatePlanBody (backend).
// The UI collects duration_days/vehicle_types, which the backend does not
// model — those are dropped. tripQuota is not collected by the UI form, so it
// defaults to -1 (unlimited).
export function toCreatePlanBody(input: {
  name: string
  price_tzs: number
  description?: string | null
  tripQuota?: number
}): CreatePlanBody {
  return {
    name: input.name,
    monthlyFee: input.price_tzs,
    tripQuota: input.tripQuota ?? -1,
    description: input.description ?? undefined,
  }
}
