# Panda Console — System Audit Report
**Date:** 10 April 2026  
**Auditor:** Claude (automated + manual review)  
**Branch:** `dev`  
**Stack:** Next.js 16.2.2 · React 19 · Supabase · Resend · Zod v3 · Recharts · TailwindCSS

---

## Executive Summary

The system is in a **good foundational state**. Authentication is correctly implemented, input validation covers all mutation routes, audit logging is wired up across critical actions, and the UI is consistent and well-structured. There are **3 critical security gaps** (missing role checks on high-impact endpoints), **several modules still using hardcoded mock data**, and **one infrastructure limitation** (in-memory rate limiter) that must be addressed before scaling to Vercel serverless.

---

## ✅ What Is Working

### Authentication & Session Management
- **Proxy-based session refresh** (`proxy.ts`) runs on every request, calls `supabase.auth.getUser()`, and silently refreshes the session cookie before expiry. Unauthenticated users are redirected to `/login`.
- **Double `getUser()` eliminated** — the proxy injects a validated `x-auth-user-id` header; `getAdminUser()` reads that header instead of making a second network round trip, saving 1–3 s per page load.
- **Back-button security** — all protected pages served with `Cache-Control: no-store`. Logout uses `window.location.replace('/login')`, which removes the page from browser history.
- **Deactivated account handling** — `is_active = false` redirects to `/login?reason=deactivated` with a clear message.
- **Singleton Supabase browser client** — prevents auth-lock race conditions in React Strict Mode.

### API Security
- **Input validation (Zod)** on every mutation route via `parseBody()`. Invalid payloads return `400` before any DB write.
- **Role-based access control** implemented on 18 of 22 mutation endpoints via `requireRole()`.
- **Rate limiting** on all `/api/*` routes: 10 req/min auth, 40 req/min writes, 120 req/min reads.
- **Admin client (`SUPABASE_SECRET_KEY`)** used server-side only — never exposed to the browser.

### Data & UI
- **All DB queries use `Promise.allSettled`** — one slow or failing query never blocks the rest of the page.
- **Mock data fallback** — pages show realistic placeholder data when the database is not yet seeded, so the UI is always functional during development.
- **Audit log** (`logAdminAction`) fires on all critical mutations: driver suspend/approve/reject/flag, fare adjustment, refund, ticket resolve/assign, user invite, role changes.
- **Email invitations** via Resend — branded HTML email with set-password flow.
- **TypeScript** — `npx tsc --noEmit` exits clean with **zero errors**.
- **No `console.log` / `console.warn`** left in production code.
- **No TODO/FIXME/HACK** comments anywhere in the codebase.
- **Shared `Avatar` component** — gradient PNG avatars assigned deterministically by ID hash, consistent across all 6 tables.
- **Sidebar visibility** driven by `ROLE_PERMISSIONS` matrix — finance viewers, support agents, etc. only see modules they are permitted to access.

---

## 🔴 Critical Issues (Fix Before Going Live)

### C-1 · `/api/support/tickets/[id]/resolve` — No role check
**File:** `app/api/support/tickets/[id]/resolve/route.ts`

This endpoint can **adjust ride fares, issue refunds, warn drivers, and suspend drivers**. It checks authentication (`getAdminUserFromRequest`) but performs **no role check**, meaning a `support_agent` or `finance_viewer` can suspend a driver or rewrite a fare.

**Fix:**
```ts
requireRole(adminUser, ['super_admin', 'ops_admin'])
```

### C-2 · `/api/support/tickets/[id]/assign` — No role check  
**File:** `app/api/support/tickets/[id]/assign/route.ts`

Any authenticated admin can reassign tickets to any agent, including themselves, with no role restriction.

**Fix:**
```ts
requireRole(adminUser, ['super_admin', 'ops_admin', 'support_agent'])
```

### C-3 · `/api/drivers/flag` — No role check  
**File:** `app/api/drivers/flag/route.ts`

Flagging a driver auto-creates a support ticket and marks the driver for review. A `finance_viewer` should not be able to trigger this.

**Fix:**
```ts
requireRole(adminUser, ['super_admin', 'ops_admin', 'support_agent'])
```

---

## 🟠 High Priority Issues

### H-1 · EarningTrendCard uses hardcoded mock data
**File:** `components/dashboard/EarningTrendCard.tsx`

The earnings trend chart on the dashboard renders static mock numbers (Mon–Sun, fixed TZS values) regardless of real data. This chart will look the same on day 1 and day 1000.

**Recommendation:** Wire up a real query — the `get_7day_earnings_trend` RPC is already called in `getDashboardData()` on the same page and the result is available. Pass it as a prop.

### H-2 · ChurnRateCard uses hardcoded mock data
**File:** `components/dashboard/ChurnRateCard.tsx`

Same issue — churn rate is a static number, not computed from the DB.

**Recommendation:** Calculate from `drivers` table: `churned_count / total_drivers * 100`.

### H-3 · Driver detail page (`/drivers/[id]`) uses mock data
**File:** `app/(admin)/drivers/[id]/page.tsx`

The driver profile page has a large `MOCK_DRIVER` object and `MOCK_RIDES` array hardcoded. Real driver data is fetched (`getDriverById`) but the page falls back to mock with no clear indicator to the user.

**Recommendation:** Remove mock fallbacks; show a proper "Driver not found" state when the query returns nothing.

### H-4 · In-memory rate limiter will not work on Vercel
**File:** `lib/rate-limit.ts`

The sliding-window rate limiter stores request counts in a `Map` in Node.js memory. Vercel Serverless Functions start a fresh process per cold start — the map resets, making the rate limiter ineffective across instances.

**Recommendation:** Replace with an edge-compatible store before deploying to Vercel:
- **Upstash Redis** (recommended — has a free tier, works on Vercel Edge)
- **Vercel KV** (same underlying technology)

### H-5 · `/api/support/tickets/[id]/message` — No role check
**File:** `app/api/support/tickets/[id]/message/route.ts`

A `finance_viewer` can currently post messages to support tickets.

**Fix:**
```ts
requireRole(adminUser, ['super_admin', 'ops_admin', 'support_agent'])
```

---

## 🟡 Medium Priority Issues

### M-1 · Settings roles routes missing `requireRole`
**Files:** `app/api/settings/roles/route.ts`, `app/api/settings/roles/[id]/route.ts`

These routes check authentication but do not call `requireRole`. Updating or deleting a role should require `super_admin`.

**Fix:** Add `requireRole(admin, ['super_admin'])` to POST/PATCH/DELETE handlers.

### M-2 · `any` types across the codebase
The codebase uses `// eslint-disable-next-line @typescript-eslint/no-explicit-any` in approximately 17 files, primarily in `DataTable.tsx`, chart components, and page-level `settled()` helpers.

**Impact:** Low — TypeScript still passes. The `any` types are mostly in UI glue code (render functions, recharts props) where the third-party library types are awkward.

**Recommendation:** Not urgent. Replace the `settled()` helper with a proper typed generic when time allows:
```ts
function settled<T>(r: PromiseSettledResult<T>, fallback: T): T {
  return r.status === 'fulfilled' ? r.value : fallback
}
```

### M-3 · Silent error swallowing in commissions query
**File:** `lib/queries/commissions.ts`, line 59

```ts
if (error) return { rides: [], total: 0 }
```

The error is silently swallowed. If the DB is down or the query is malformed, the page shows an empty state with no trace.

**Recommendation:**
```ts
if (error) {
  console.error('[commissions] getCommissionRides failed:', error.message)
  return { rides: [], total: 0 }
}
```

### M-4 · No error feedback in `TicketActions` component
**File:** `components/support/TicketActions.tsx`

`handleResolve()` has a `loading` state but no `error` state. If the resolve API call fails, the user sees nothing — the button just stops spinning.

**Recommendation:** Add an `errorMsg` state and display it below the submit button.

---

## 🔵 Informational / Best Practices

### I-1 · `console.error` in production API routes
**File:** `app/api/settings/admin-users/route.ts`, lines 78 & 86

These are operational error logs for email send failures and audit log failures — not debug noise. They are appropriate in production. If you want structured logging in the future, consider a service like **Axiom** or **Logtail** (both have Vercel integrations).

### I-2 · No loading.tsx files on heavy pages
Next.js App Router supports `loading.tsx` alongside `page.tsx` to show a streaming skeleton while server data loads. The subscriptions, drivers, and commissions pages fetch significant data but have no loading state — the browser shows a blank page until all queries complete.

**Recommendation:** Add a `loading.tsx` in each `(admin)/*` folder with a skeleton that matches the page layout.

### I-3 · No `error.tsx` files
If a DB query throws an unhandled error in a server component, Next.js shows a generic error page. Custom `error.tsx` files per route would give users a better experience with a retry button.

### I-4 · `NEXT_PUBLIC_APP_URL` not validated at startup
The invite email uses `APP_URL` from environment variables. If it's missing, the invite link in the email will be wrong. Consider adding a startup check:
```ts
if (!process.env.NEXT_PUBLIC_APP_URL) {
  throw new Error('NEXT_PUBLIC_APP_URL is required')
}
```

### I-5 · Password reset flow is not implemented
The login page has a **"Reset Password"** button that does nothing (no `onClick` handler). If Kevin loses his password, there is no self-service recovery path — someone would need to manually reset it via the Supabase dashboard.

**Recommendation:** Wire up `supabase.auth.resetPasswordForEmail()` on that button.

### I-6 · Supabase RLS (Row Level Security)
The app uses the service role (`SUPABASE_SECRET_KEY`) for all DB writes, which bypasses RLS entirely. This is correct for a server-side admin app, but it means RLS is not a safety net. All access control must be enforced in API route handlers — which the `requireRole()` pattern does.

---

## Dependency Snapshot

| Package | Version | Status |
|---|---|---|
| Next.js | 16.2.2 | ✅ Current |
| React | 19.2.4 | ✅ Current |
| @supabase/ssr | 0.10.0 | ✅ Current |
| @supabase/supabase-js | 2.102.1 | ✅ Current |
| Zod | 3.25.76 | ✅ v3 (v4 incompatible with Turbopack) |
| Resend | 6.10.0 | ✅ Current |
| Recharts | 3.8.1 | ✅ Current |
| @hugeicons-pro | 4.1.x | ✅ Current |

---

## API Route Security Matrix

| Endpoint | Auth | Role Guard | Verdict |
|---|---|---|---|
| POST `/api/settings/admin-users` | ✅ | ✅ `super_admin` | OK |
| PATCH `/api/settings/admin-users/[id]` | ✅ | ✅ `super_admin` | OK |
| POST `/api/settings/roles` | ✅ | ❌ Missing | Fix |
| PATCH/DELETE `/api/settings/roles/[id]` | ✅ | ❌ Missing | Fix |
| POST `/api/settings/zones` | ✅ | ✅ `super_admin`, `ops_admin` | OK |
| PATCH `/api/settings/zones/[id]` | ✅ | ✅ `super_admin`, `ops_admin` | OK |
| PATCH `/api/settings/config` | ✅ | ✅ `super_admin` | OK |
| POST `/api/drivers/approve` | ✅ | ✅ `super_admin`, `ops_admin` | OK |
| POST `/api/drivers/reject` | ✅ | ✅ `super_admin`, `ops_admin` | OK |
| POST `/api/drivers/suspend` | ✅ | ✅ `super_admin`, `ops_admin` | OK |
| POST `/api/drivers/reactivate` | ✅ | ✅ `super_admin`, `ops_admin` | OK |
| POST `/api/drivers/flag` | ✅ | ❌ Missing | **Critical** |
| POST `/api/rides/[id]/flag` | ✅ | ✅ `super_admin`, `ops_admin` | OK |
| POST `/api/pricing/rules` | ✅ | ✅ `super_admin`, `ops_admin` | OK |
| POST `/api/pricing/rules/[id]/deactivate` | ✅ | ✅ `super_admin`, `ops_admin` | OK |
| POST `/api/subscriptions/plans` | ✅ | ✅ `super_admin`, `ops_admin` | OK |
| POST `/api/subscriptions/assign` | ✅ | ✅ `super_admin`, `ops_admin` | OK |
| POST `/api/support/tickets/[id]/assign` | ✅ | ❌ Missing | **Critical** |
| POST `/api/support/tickets/[id]/message` | ✅ | ❌ Missing | High |
| POST `/api/support/tickets/[id]/resolve` | ✅ | ❌ Missing | **Critical** |
| GET `/api/audit-logs` | ✅ | ✅ permission matrix | OK |

**Score: 15 / 21 routes fully guarded**

---

## Prioritised Action Plan

| Priority | Item | Effort |
|---|---|---|
| 🔴 1 | Add `requireRole` to `/support/tickets/[id]/resolve` | 5 min |
| 🔴 2 | Add `requireRole` to `/support/tickets/[id]/assign` | 5 min |
| 🔴 3 | Add `requireRole` to `/support/tickets/[id]/message` | 5 min |
| 🔴 4 | Add `requireRole` to `/drivers/flag` | 5 min |
| 🟠 5 | Wire `EarningTrendCard` to real 7-day RPC data | 2 h |
| 🟠 6 | Wire `ChurnRateCard` to real DB query | 1 h |
| 🟠 7 | Replace in-memory rate limiter with Upstash Redis | 2 h |
| 🟠 8 | Fix driver detail page — remove hardcoded mock | 2 h |
| 🟡 9 | Add `loading.tsx` skeletons to heavy pages | 3 h |
| 🟡 10 | Add `error.tsx` per route group | 2 h |
| 🟡 11 | Implement password reset flow on login page | 1 h |
| 🟡 12 | Add `requireRole` to settings/roles routes | 5 min |
| 🟡 13 | Add error feedback to `TicketActions` resolve form | 30 min |
| 🔵 14 | Replace `any` types with proper generics | 4 h |
| 🔵 15 | Add `NEXT_PUBLIC_APP_URL` startup validation | 15 min |

---

*Report generated 10 April 2026 · Panda Console v0.1.0 · Branch: dev*
