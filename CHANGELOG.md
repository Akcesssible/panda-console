# Changelog

All notable changes to Panda Console are documented here.  
Format: [Semantic Versioning](https://semver.org) — `MAJOR.MINOR.PATCH`

---

## [0.6.0] — 2026-04-19

### Security
- `requireRole` added to all previously unguarded API routes — API security score now **21/21**
  - `/api/support/tickets/[id]/resolve` — `super_admin`, `ops_admin` only
  - `/api/support/tickets/[id]/assign` — `super_admin`, `ops_admin`, `support_agent`
  - `/api/support/tickets/[id]/message` — `super_admin`, `ops_admin`, `support_agent`
  - `/api/drivers/flag` — `super_admin`, `ops_admin`, `support_agent`

### Features
- **Password reset flow** — full self-service: `/forgot-password` → email → `/reset-password`
- **Real dashboard data** — `EarningTrendCard` wired to `get_7day_earnings_trend` RPC; `ChurnRateCard` computed from real driver churn data
- **Driver detail page** — mock data removed; uses real DB data with proper not-found state

### Infrastructure
- **Upstash Redis rate limiter** — replaces in-memory `Map`; works correctly on Vercel Serverless. Falls back to in-memory for local dev when env vars are absent

### Fixes
- Delete admin user now explicitly removes `admin_users` row instead of relying on CASCADE
- Invite modal shows user-friendly errors instead of raw Supabase messages
- `status` column writes made defensive while migration 006 was pending

---

## [0.5.0] — 2026-04-10

### Features
- **Loading skeletons** — `loading.tsx` added to all 14 admin routes; shared `Skeleton.tsx` component
- **Error boundaries** — `error.tsx` added across the hierarchy; branded `ErrorView` component with retry + back link
- **Delete admin user** — `DeleteConfirmModal` replaces `window.confirm`; condition fixed to handle null `status`

### Fixes
- Vercel build error: `useSearchParams()` wrapped in `<Suspense>` on login page (`LoginForm.tsx` extracted)
- `Tabs.tsx` unused component deleted (was triggering IDE lint warning)
- MetaMask console error explained (not a code issue — browser extension injection)

---

## [0.4.0] — 2026-04-10

### Features
- **Commissions page** — extracted from Subscriptions tab into `/commissions` with stats row + table; active subscribers excluded from commission charges
- **Gradient avatars** — 9 gradient PNG avatars (`avatar_01–09.png`) across all tables, TopBar, and Settings; stable per-user hash assignment
- **Audit logs page** — new `/audit-logs` route with `AuditLogsView`
- **System audit report** — `docs/SYSTEM_AUDIT_2026-04-10.md`

### Security
- Proxy-based auth with `x-auth-user-id` header injection (eliminates double `getUser()` call)
- Back-button blocking: `Cache-Control: no-store` + `window.location.replace` on logout
- DEV_ADMIN bypass removed

### Fixes
- Login time reduced from ~8 s to <2 s (removed redundant Supabase Auth round trip)
- TopBar avatar and identity tied to the real logged-in admin user

---

## [0.3.0] — 2026-04-09

### Features
- **Settings module** — Users tab (invite, deactivate, reactivate, role change), Roles tab (custom roles with permission matrix), Zones tab, System Config tab
- **Admin user lifecycle** — status tracking: `invited → active → logged_out → deactivated`
- Session revocation on deactivation (Supabase `auth.admin.signOut` global)
- Email invitations via Resend with branded HTML template and set-password flow

### Security
- Role-based access control (`requireRole`) on all Settings API routes
- Zod validation on all mutation endpoints

---

## [0.2.0] — 2026-04-09

### Features
- README rewritten with full project overview, architecture diagram, and setup guide

---

## [0.1.0] — 2026-04-08

### Features
- **Initial MVP** — full 8-module admin console
  - Dashboard (stats, activity feed, alert cards)
  - Drivers (list, detail, approve/reject/suspend/flag)
  - Riders (list, status management)
  - Rides (list, detail, flag)
  - Subscriptions (plans, assignments, payments)
  - Pricing (rules by zone/vehicle type)
  - Support (ticket queue, conversation, resolve/assign)
  - Settings (foundation)
- Supabase SSR auth with proxy-based session management
- Audit logging on all critical mutations
- Input validation via Zod on all API routes
- Rate limiting on all `/api/*` routes
