import { createAdminClient } from '@/lib/supabase/server'
import type { DriverSubscription, SubscriptionPayment, SubscriptionPlan } from '@/lib/types'

const PER_PAGE = 20

export async function getSubscriptions(params: {
  status?: string
  driverId?: string
  page?: number
}) {
  const supabase = createAdminClient()
  const { status, driverId, page = 1 } = params
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('driver_subscriptions')
    .select(`
      *,
      drivers(id, full_name, phone, driver_number),
      subscription_plans(id, name, price_tzs, duration_days)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (driverId) query = query.eq('driver_id', driverId)

  const { data, count, error } = await query
  if (error) throw error
  return { subscriptions: data as DriverSubscription[], total: count ?? 0 }
}

export async function getPlans() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price_tzs', { ascending: true })
  if (error) throw error
  return data as SubscriptionPlan[]
}

export async function getPayments(params: { status?: string; page?: number }) {
  const supabase = createAdminClient()
  const { status, page = 1 } = params
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('subscription_payments')
    .select(`
      *,
      drivers(id, full_name, phone, driver_number),
      subscription_plans(name, price_tzs)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
  if (error) throw error
  return { payments: data as SubscriptionPayment[], total: count ?? 0 }
}
