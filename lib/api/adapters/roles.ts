import type { AdminRole } from '@/lib/types'
import type { BackendAdminRole } from '@/lib/api/types'

// The backend has 5 admin roles; the UI has 4. ADMIN and OPERATIONS_STAFF both
// collapse to the UI's `ops_admin`. This loses the ADMIN/OPERATIONS_STAFF
// distinction in the UI — confirm with product if that distinction matters.
const BACKEND_TO_UI: Record<BackendAdminRole, AdminRole> = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'ops_admin',
  OPERATIONS_STAFF: 'ops_admin',
  CUSTOMER_SUPPORT: 'support_agent',
  FINANCE_OFFICER: 'finance_viewer',
}

// Reverse map for sending a role to the backend (e.g. creating an admin user).
// ops_admin maps back to ADMIN (the broader of the two).
const UI_TO_BACKEND: Record<AdminRole, BackendAdminRole> = {
  super_admin: 'SUPER_ADMIN',
  ops_admin: 'ADMIN',
  support_agent: 'CUSTOMER_SUPPORT',
  finance_viewer: 'FINANCE_OFFICER',
}

export function toUiRole(role: BackendAdminRole | string): AdminRole {
  const normalized = role.replace(/^ROLE_/, '').toUpperCase() as BackendAdminRole
  return BACKEND_TO_UI[normalized] ?? 'support_agent'
}

export function toBackendRole(role: AdminRole): BackendAdminRole {
  return UI_TO_BACKEND[role]
}
