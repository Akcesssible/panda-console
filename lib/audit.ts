import { createAdminClient } from '@/lib/supabase/server'
import type { AuditLogParams } from '@/lib/types'

// Append-only audit log — called after every admin mutation
export async function logAdminAction(params: AuditLogParams) {
  const supabase = createAdminClient()
  const {
    adminId, adminEmail, adminRole,
    action, entityType, entityId,
    oldValue, newValue, metadata, request,
  } = params

  await supabase.from('audit_logs').insert({
    admin_id: adminId,
    admin_email: adminEmail,
    admin_role: adminRole,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
    metadata: metadata ?? null,
    ip_address: request?.headers?.get('x-forwarded-for') ?? null,
    user_agent: request?.headers?.get('user-agent') ?? null,
  })
}

// Action code constants — keeps usage consistent across modules
export const AUDIT_ACTIONS = {
  DRIVER_APPROVE: 'driver.approve',
  DRIVER_REJECT: 'driver.reject',
  DRIVER_SUSPEND: 'driver.suspend',
  DRIVER_REACTIVATE: 'driver.reactivate',
  DRIVER_FLAG: 'driver.flag',
  SUB_ASSIGN: 'subscription.assign',
  SUB_REVOKE: 'subscription.revoke',
  SUB_EXTEND: 'subscription.extend',
  SUB_PLAN_CREATE: 'subscription.plan.create',
  SUB_PLAN_UPDATE: 'subscription.plan.update',
  PRICING_CREATE: 'pricing.rule.create',
  PRICING_DEACTIVATE: 'pricing.rule.deactivate',
  TICKET_ASSIGN: 'support.ticket.assign',
  TICKET_RESOLVE: 'support.ticket.resolve',
  FARE_ADJUST: 'support.fare.adjust',
  REFUND_ISSUE: 'support.refund.issue',
  ADMIN_CREATE: 'admin.user.create',
  ADMIN_DEACTIVATE: 'admin.user.deactivate',
  ADMIN_ROLE_CHANGE: 'admin.user.role_change',
  ZONE_CREATE: 'zone.create',
  ZONE_UPDATE: 'zone.update',
  ROLE_CREATE: 'role.create',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',
} as const
