// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for backend (Kong gateway) paths.
//
// ⚠️  VERIFY THESE WITH curl AGAINST A RUNNING KONG BEFORE TRUSTING THEM.
//     The exact public URLs depend on Kong route config + each service's
//     servlet context-path + the controller @RequestMapping. Several of these
//     are "doubled" (e.g. /trips/trips/admin) because the controller mapping
//     repeats the service prefix. See the backend kong.yml.
//
// Known backend routing issue (flagged during integration):
//   auth-service sets `server.servlet.context-path: /api/auth` AND its
//   controllers use absolute mappings (/api/auth/admin, /api/admin/users).
//   With the context-path present, these double and the Kong admin routes
//   404. The paths below assume the context-path is REMOVED from
//   auth-service/src/main/resources/application.yml (the consistent config).
//   If it is not removed, admin login/user routes will not resolve.
// ─────────────────────────────────────────────────────────────────────────────

const V1 = '/api/v1'

export const paths = {
  // Admin authentication (auth-service via the /api/v1/auth Kong route)
  adminLogin: `${V1}/auth/admin/login`,
  adminChangePassword: `${V1}/auth/admin/change-password`,
  adminLogout: `${V1}/auth/admin/logout`,

  // Admin user management (auth-service via the /api/v1/admin Kong route)
  adminUsers: `${V1}/admin/users`,
  adminUser: (id: string) => `${V1}/admin/users/${id}`,
  adminUserResetPassword: (id: string) => `${V1}/admin/users/${id}/reset-password`,

  // Drivers (driver-service). Note the doubled /admin/drivers segment.
  drivers: `${V1}/drivers/admin/drivers`,
  driversPending: `${V1}/drivers/admin/drivers/pending`,
  driver: (id: string) => `${V1}/drivers/admin/drivers/${id}`,
  driverApprove: (id: string) => `${V1}/drivers/admin/drivers/${id}/approve`,
  driverReject: (id: string) => `${V1}/drivers/admin/drivers/${id}/reject`,
  driverSuspend: (id: string) => `${V1}/drivers/admin/drivers/${id}/suspend`,
  driverReactivate: (id: string) => `${V1}/drivers/admin/drivers/${id}/reactivate`,

  // Trips (trip-service). Note the doubled /trips/admin segment.
  tripsAdmin: `${V1}/trips/trips/admin`,
  trip: (id: string) => `${V1}/trips/trips/admin/${id}`,
  driverTripsAdmin: (driverId: string) => `${V1}/trips/trips/admin/drivers/${driverId}`,
  driverTripStatsAdmin: (driverId: string) => `${V1}/trips/trips/admin/drivers/${driverId}/stats`,

  // Subscription plans (subscription-service)
  subscriptionPlans: `${V1}/subscriptions/plans`,
  subscriptionPlan: (id: string) => `${V1}/subscriptions/plans/${id}`,
} as const
