# Panda Console

Internal back-office administration platform for **Panda Hailing** — Tanzania's ride-hailing service. Built for operations, support, and finance teams to manage the platform end-to-end from a single interface.

---

## Modules

| Module | Description |
|---|---|
| **Dashboard** | Real-time KPIs — active rides, revenue, driver availability |
| **Drivers** | Approve, reject, suspend, flag, and reactivate driver accounts |
| **Riders** | View rider profiles and activity |
| **Rides** | Monitor live and historical trips, flag suspicious rides |
| **Pricing** | Create and manage fare rules per zone |
| **Subscriptions** | Assign and manage driver subscription plans |
| **Support** | Handle tickets, assign agents, adjust fares, issue refunds |
| **Settings** | Manage admin users, roles & permissions, cities/zones, system config, audit logs |

---

## Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **Database & Auth** — [Supabase](https://supabase.com) (PostgreSQL + RLS + Auth)
- **Language** — TypeScript
- **Styling** — Tailwind CSS v4
- **Validation** — Zod v3
- **Charts** — Recharts
- **Icons** — HugeIcons Pro

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Akcesssible/panda-console.git
cd panda-console
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Then fill in your values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_secret_service_role_key
```

> Get these from your Supabase project under **Settings → API**.

### 4. Run database migrations

Run each file in `supabase/migrations/` in order via the Supabase SQL Editor, then seed default data:

```bash
# In Supabase SQL Editor, run in order:
# 001_... → 002_... → 003_... → 004_... → 005_...
# Then run supabase/seed.sql
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
panda-admin/
├── app/
│   ├── (admin)/          # Protected admin routes (dashboard, drivers, rides, etc.)
│   ├── api/              # API route handlers
│   └── login/            # Auth page
├── components/
│   ├── ui/               # Shared components (DataTable, Modal, Pagination, etc.)
│   └── [module]/         # Per-module view components
├── lib/
│   ├── auth.ts           # Session + role helpers
│   ├── audit.ts          # Audit logging
│   ├── rate-limit.ts     # In-memory rate limiter
│   ├── validations.ts    # Zod schemas for all API routes
│   ├── supabase/         # Supabase client (browser + server)
│   └── types/            # Shared TypeScript interfaces
├── supabase/
│   ├── migrations/       # SQL migration files (run in order)
│   └── seed.sql          # Default roles and config
└── proxy.ts              # Rate limiting proxy (Next.js 16)
```

---

## Roles & Permissions

Access is controlled by four built-in roles:

| Role | Description |
|---|---|
| **Super Admin** | Full access — users, roles, config, all modules |
| **Ops Admin** | Drivers, rides, pricing, zones |
| **Support Agent** | Support tickets only |
| **Finance Viewer** | Pricing and subscriptions, read-only |

Custom roles with granular per-module permissions (Create / Read / Update / Delete / Approve) can be created by a Super Admin under **Settings → Roles**.

---

## Security

- All API routes require an authenticated admin session
- Role-based access enforced server-side via `requireRole()`
- Input validation on every mutation route via Zod schemas
- Rate limiting via `proxy.ts`: 10 req/min (auth), 40 req/min (writes), 120 req/min (reads)
- Supabase RLS blocks direct DB access from anon/public clients
- Service role key is server-only — never exposed to the browser
- All admin actions are recorded in the `audit_logs` table

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `master` | Production-ready code |
| `dev` | Active development — PRs target this branch |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase publishable (anon) key |
| `SUPABASE_SECRET_KEY` | ✅ | Supabase service role key — **never expose client-side** |

---

*Panda Hailing — Tanzania 🇹🇿*
