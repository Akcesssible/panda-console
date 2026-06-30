import type { AuditLogParams } from '@/lib/types'

// No backend audit-write endpoint exists yet. Log locally so mutations leave a
// trace without blocking, and the call-sites need no changes when it lands.
export async function logAdminAction(params: AuditLogParams): Promise<void> {
  const { action, entityType, entityId, adminEmail } = params
  console.warn('[audit]', action, entityType, entityId ?? '-', 'by', adminEmail)
}

// Action code constants — keeps usage consistent across modules
export const AUDIT_ACTIONS = {
  DRIVER_APPROVE: 'driver.approve',
  DRIVER_REJECT: 'driver.reject',
  DRIVER_SUSPEND: 'driver.suspend',
  DRIVER_BAN: 'driver.ban',
  DRIVER_REACTIVATE: 'driver.reactivate',
  DRIVER_FLAG: 'driver.flag',
  SUB_ASSIGN: 'subscription.assign',
  SUB_REVOKE: 'subscription.revoke',
  SUB_EXTEND: 'subscription.extend',
  SUB_PLAN_CREATE: 'subscription.plan.create',
  SUB_PLAN_UPDATE: 'subscription.plan.update',
  SUB_PLAN_DELETE: 'subscription.plan.deactivate',
  PRICING_CREATE: 'pricing.rule.create',
  PRICING_DEACTIVATE: 'pricing.rule.deactivate',
  TICKET_ASSIGN: 'support.ticket.assign',
  TICKET_RESOLVE: 'support.ticket.resolve',
  FARE_ADJUST: 'support.fare.adjust',
  REFUND_ISSUE: 'support.refund.issue',
  ADMIN_CREATE: 'admin.user.create',
  ADMIN_DEACTIVATE: 'admin.user.deactivate',
  ADMIN_ROLE_CHANGE: 'admin.user.role_change',
  RIDE_FLAG: 'ride.flag',
  TICKET_MESSAGE: 'support.ticket.message',
  CONFIG_UPDATE: 'settings.config.update',
  ADMIN_UPDATE: 'admin.user.update',
  ZONE_CREATE: 'zone.create',
  ZONE_UPDATE: 'zone.update',
  ROLE_CREATE: 'role.create',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',
} as const
