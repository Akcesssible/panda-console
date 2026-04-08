import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminUserFromRequest, requireRole } from '@/lib/auth'
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const supabase = createAdminClient()

  let query = supabase.from('pricing_rules').select('*, zones(id, name)').order('priority', { ascending: false })

  const vehicleType = searchParams.get('vehicle_type')
  const zoneId = searchParams.get('zone_id')
  const active = searchParams.get('active')

  if (vehicleType) query = query.eq('vehicle_type', vehicleType)
  if (zoneId) query = query.eq('zone_id', zoneId)
  if (active !== null) query = query.eq('is_active', active === 'true')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rules: data })
}

export async function POST(request: Request) {
  const adminUser = await getAdminUserFromRequest()
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requireRole(adminUser, ['super_admin', 'ops_admin']) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await request.json()
  const {
    name, vehicle_type, zone_id, base_fare_tzs, per_km_rate_tzs,
    per_minute_rate, minimum_fare_tzs, peak_multiplier,
    peak_start_time, peak_end_time, peak_days, priority,
  } = body

  if (!name || base_fare_tzs == null || per_km_rate_tzs == null) {
    return NextResponse.json({ error: 'name, base_fare_tzs, per_km_rate_tzs required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('pricing_rules')
    .insert({
      name, vehicle_type: vehicle_type ?? null, zone_id: zone_id ?? null,
      base_fare_tzs, per_km_rate_tzs, per_minute_rate: per_minute_rate ?? 0,
      minimum_fare_tzs: minimum_fare_tzs ?? null,
      peak_multiplier: peak_multiplier ?? 1.0,
      peak_start_time: peak_start_time ?? null, peak_end_time: peak_end_time ?? null,
      peak_days: peak_days ?? null,
      priority: priority ?? 0,
      is_active: true,
      effective_from: new Date().toISOString(),
      created_by: adminUser.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    adminId: adminUser.id, adminEmail: adminUser.email, adminRole: adminUser.role,
    action: AUDIT_ACTIONS.PRICING_CREATE, entityType: 'pricing_rule', entityId: data.id,
    newValue: { name, vehicle_type, base_fare_tzs, per_km_rate_tzs }, request,
  })

  return NextResponse.json({ rule: data })
}
