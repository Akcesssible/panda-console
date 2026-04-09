-- ============================================================
-- Migration 004 — Secure custom_roles table
-- ============================================================

-- 1. Enable Row Level Security
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

-- 2. Block all anonymous/browser direct access
--    (service_role used server-side bypasses RLS automatically)
CREATE POLICY "No anon access" ON custom_roles
  FOR ALL TO anon USING (false);

-- 3. Authenticated users (JWT sessions) get read-only access
--    — the console UI reads roles to display them in dropdowns.
--    All mutations (INSERT / UPDATE / DELETE) go through API routes
--    running as service_role, so no write policy is needed here.
CREATE POLICY "Authenticated read-only" ON custom_roles
  FOR SELECT TO authenticated USING (true);

-- 4. Prevent accidental direct writes from authenticated sessions.
--    Only the service_role (server API routes) may mutate.
CREATE POLICY "No authenticated writes" ON custom_roles
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);
