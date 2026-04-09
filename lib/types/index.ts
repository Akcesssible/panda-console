// ============================================================
// Panda Console — Shared TypeScript Types
// ============================================================

export type AdminRole = 'super_admin' | 'ops_admin' | 'support_agent' | 'finance_viewer'
export type DriverStatus = 'pending' | 'active' | 'suspended' | 'churned'
export type RiderStatus = 'active' | 'inactive' | 'banned'
export type VehicleType = 'bodaboda' | 'bajaj' | 'car'
export type RideStatus = 'requested' | 'accepted' | 'ongoing' | 'completed' | 'cancelled'
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'grace_period'
export type PaymentStatus = 'pending' | 'completed' | 'failed'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketType = 'fare_dispute' | 'driver_complaint' | 'rider_complaint' | 'technical' | 'other'
export type ResolutionAction = 'fare_adjusted' | 'refund_issued' | 'driver_warned' | 'driver_suspended' | 'closed_no_action'

export interface AdminUser {
  id: string
  auth_id: string | null
  full_name: string
  email: string
  role: AdminRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Zone {
  id: string
  name: string
  city: string
  is_active: boolean
  boundary: unknown | null
  created_at: string
}

export interface Driver {
  id: string
  driver_number: string
  full_name: string
  email: string | null
  phone: string
  date_of_birth: string | null
  national_id: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  status: DriverStatus
  zone_id: string | null
  rating: number
  total_trips: number
  completed_trips: number
  cancelled_trips: number
  complaints_count: number
  churn_reason: string | null
  suspended_reason: string | null
  suspended_at: string | null
  suspended_by: string | null
  approved_at: string | null
  approved_by: string | null
  last_active_at: string | null
  joined_at: string
  created_at: string
  updated_at: string
  avatar_url: string | null
  address: string | null
  // Joined
  zones?: Zone | null
  vehicles?: Vehicle[]
  driver_subscriptions?: DriverSubscription[]
}

export interface Vehicle {
  id: string
  driver_id: string
  vehicle_type: VehicleType
  make: string
  model: string
  year: number | null
  color: string | null
  engine_cc: number | null
  license_plate: string
  owner_name: string | null
  owner_phone: string | null
  owner_email: string | null
  is_verified: boolean
  image_url: string | null
  photos: string[]
  created_at: string
}

export interface DriverDocument {
  id: string
  driver_id: string
  doc_type: string
  file_url: string
  is_verified: boolean
  verified_by: string | null
  verified_at: string | null
  uploaded_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  duration_days: number
  price_tzs: number
  vehicle_types: VehicleType[]
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DriverSubscription {
  id: string
  driver_id: string
  plan_id: string
  status: SubscriptionStatus
  started_at: string
  expires_at: string
  grace_ends_at: string | null
  rides_remaining: number | null
  assigned_by: string | null
  revoked_by: string | null
  revoked_at: string | null
  revoke_reason: string | null
  created_at: string
  // Joined
  subscription_plans?: SubscriptionPlan
}

export interface SubscriptionPayment {
  id: string
  driver_id: string
  subscription_id: string | null
  plan_id: string
  amount_tzs: number
  payment_method: string
  phone_used: string | null
  provider: string | null
  transaction_ref: string | null
  status: PaymentStatus
  paid_at: string | null
  created_at: string
  // Joined
  drivers?: Pick<Driver, 'id' | 'full_name' | 'phone' | 'driver_number'>
  subscription_plans?: SubscriptionPlan
}

export interface PricingRule {
  id: string
  name: string
  vehicle_type: VehicleType | null
  zone_id: string | null
  city: string | null
  base_fare_tzs: number
  per_km_rate_tzs: number
  per_minute_rate: number
  minimum_fare_tzs: number | null
  peak_multiplier: number
  peak_start_time: string | null
  peak_end_time: string | null
  peak_days: number[] | null
  priority: number
  is_active: boolean
  effective_from: string
  effective_until: string | null
  created_by: string | null
  created_at: string
  // Joined
  zones?: Zone | null
}

export interface Ride {
  id: string
  ride_number: string
  driver_id: string | null
  rider_phone: string
  rider_name: string | null
  vehicle_type: VehicleType
  zone_id: string | null
  pricing_rule_id: string | null
  status: RideStatus
  pickup_address: string
  pickup_lat: number | null
  pickup_lng: number | null
  destination_address: string
  destination_lat: number | null
  destination_lng: number | null
  distance_km: number | null
  duration_minutes: number | null
  base_fare_tzs: number | null
  distance_fare_tzs: number | null
  time_fare_tzs: number | null
  peak_multiplier: number
  total_fare_tzs: number | null
  commission_rate: number
  commission_tzs: number
  driver_earnings_tzs: number | null
  is_subscriber_ride: boolean
  cancellation_reason: string | null
  cancelled_by: string | null
  is_flagged: boolean
  flag_reason: string | null
  requested_at: string
  accepted_at: string | null
  started_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  created_at: string
  // Joined
  drivers?: Pick<Driver, 'id' | 'full_name' | 'phone' | 'driver_number' | 'rating'> | null
  zones?: Zone | null
}

export interface SupportTicket {
  id: string
  ticket_number: string
  type: TicketType
  status: TicketStatus
  subject: string
  description: string
  reported_by: string
  reporter_type: string
  driver_id: string | null
  ride_id: string | null
  assigned_to: string | null
  resolution_action: ResolutionAction | null
  resolution_note: string | null
  fare_adjusted_tzs: number | null
  refund_amount_tzs: number | null
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
  updated_at: string
  // Joined
  drivers?: Pick<Driver, 'id' | 'full_name' | 'phone' | 'driver_number'> | null
  rides?: Pick<Ride, 'id' | 'ride_number' | 'total_fare_tzs' | 'status'> | null
  admin_users?: Pick<AdminUser, 'id' | 'full_name' | 'email'> | null
}

export interface TicketMessage {
  id: string
  ticket_id: string
  sender_type: string
  sender_id: string | null
  sender_name: string
  message: string
  created_at: string
}

export interface Rider {
  id: string
  rider_number: string
  full_name: string
  phone: string
  email: string | null
  avatar_url: string | null
  status: RiderStatus
  total_rides: number
  completed_rides: number
  cancelled_rides: number
  last_ride_at: string | null
  registered_at: string
  created_at: string
  updated_at: string
  ban_reason: string | null
  banned_at: string | null
}

export interface AuditLog {
  id: string
  admin_id: string | null
  admin_email: string
  admin_role: string
  action: string
  entity_type: string
  entity_id: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface AuditLogParams {
  adminId: string
  adminEmail: string
  adminRole: string
  action: string
  entityType: string
  entityId?: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  metadata?: Record<string, unknown>
  request?: Request
}

// Permissions matrix
export const ROLE_PERMISSIONS: Record<AdminRole, Record<string, 'full' | 'read' | 'write' | 'none'>> = {
  super_admin: {
    dashboard: 'full', drivers: 'full', rides: 'full', riders: 'full', subscriptions: 'full',
    pricing: 'full', support: 'full', reports: 'full', settings: 'full',
    audit_logs: 'full', admin_users: 'full',
  },
  ops_admin: {
    dashboard: 'full', drivers: 'full', rides: 'full', riders: 'full', subscriptions: 'full',
    pricing: 'write', support: 'full', reports: 'read', settings: 'none',
    audit_logs: 'read', admin_users: 'none',
  },
  support_agent: {
    dashboard: 'read', drivers: 'read', rides: 'read', riders: 'read', subscriptions: 'none',
    pricing: 'none', support: 'full', reports: 'none', settings: 'none',
    audit_logs: 'none', admin_users: 'none',
  },
  finance_viewer: {
    dashboard: 'read', drivers: 'none', rides: 'none', riders: 'none', subscriptions: 'read',
    pricing: 'none', support: 'none', reports: 'read', settings: 'none',
    audit_logs: 'none', admin_users: 'none',
  },
}

export function canAccess(role: AdminRole, module: string, level: 'read' | 'write' | 'full' = 'read'): boolean {
  const perm = ROLE_PERMISSIONS[role]?.[module]
  if (!perm || perm === 'none') return false
  if (level === 'read') return true
  if (level === 'write') return perm === 'write' || perm === 'full'
  return perm === 'full'
}
