-- ============================================================
-- Panda Console — Seed Data
-- ============================================================

-- Zones
INSERT INTO zones (id, name, city) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Kinondoni', 'Dar es Salaam'),
  ('11111111-0000-0000-0000-000000000002', 'Ilala', 'Dar es Salaam'),
  ('11111111-0000-0000-0000-000000000003', 'Temeke', 'Dar es Salaam'),
  ('11111111-0000-0000-0000-000000000004', 'Ubungo', 'Dar es Salaam'),
  ('11111111-0000-0000-0000-000000000005', 'Kigamboni', 'Dar es Salaam');

-- Subscription Plans
INSERT INTO subscription_plans (name, duration_days, price_tzs, vehicle_types, description) VALUES
  ('Weekly Standard', 7, 15000, '{bodaboda,bajaj,car}', 'Weekly plan — 0% commission for 7 days'),
  ('Monthly Pro', 30, 50000, '{bodaboda,bajaj,car}', 'Monthly plan — 0% commission for 30 days'),
  ('Weekly Bodaboda', 7, 10000, '{bodaboda}', 'Weekly plan for Bodaboda riders only'),
  ('Monthly Bajaj', 30, 35000, '{bajaj}', 'Monthly plan for Bajaj riders only');

-- Default Pricing Rules
INSERT INTO pricing_rules (name, vehicle_type, base_fare_tzs, per_km_rate_tzs, per_minute_rate, minimum_fare_tzs, priority)
VALUES
  ('Bodaboda Base', 'bodaboda', 1000, 500, 10, 1500, 1),
  ('Bajaj Base', 'bajaj', 1500, 700, 15, 2000, 1),
  ('Car Base', 'car', 2000, 1000, 20, 3000, 1);

-- Default Roles
-- These mirror the hardcoded admin_role enum but live in custom_roles
-- so they appear in the Roles tab and can be read by the UI.
-- They are marked with is_builtin = true to prevent deletion.
INSERT INTO custom_roles (id, name, description, permissions) VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Super Admin',
    'Full access to all modules, settings, user management, and audit logs.',
    '{
      "dashboard":     {"create":true,"read":true,"update":true,"delete":true,"approve":true},
      "drivers":       {"create":true,"read":true,"update":true,"delete":true,"approve":true},
      "rides":         {"create":true,"read":true,"update":true,"delete":true,"approve":true},
      "riders":        {"create":true,"read":true,"update":true,"delete":true,"approve":true},
      "subscriptions": {"create":true,"read":true,"update":true,"delete":true,"approve":true},
      "pricing":       {"create":true,"read":true,"update":true,"delete":true,"approve":true},
      "support":       {"create":true,"read":true,"update":true,"delete":true,"approve":true},
      "reports":       {"create":true,"read":true,"update":true,"delete":true,"approve":true},
      "settings":      {"create":true,"read":true,"update":true,"delete":true,"approve":true}
    }'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'Ops Admin',
    'Manage drivers, rides, riders, subscriptions, and support. Read-only reports.',
    '{
      "dashboard":     {"create":true, "read":true,"update":true,"delete":true,"approve":true},
      "drivers":       {"create":true, "read":true,"update":true,"delete":false,"approve":true},
      "rides":         {"create":false,"read":true,"update":true,"delete":false,"approve":true},
      "riders":        {"create":false,"read":true,"update":true,"delete":false,"approve":false},
      "subscriptions": {"create":true, "read":true,"update":true,"delete":false,"approve":true},
      "pricing":       {"create":true, "read":true,"update":false,"delete":false,"approve":false},
      "support":       {"create":true, "read":true,"update":true,"delete":false,"approve":true},
      "reports":       {"create":false,"read":true,"update":false,"delete":false,"approve":false},
      "settings":      {"create":false,"read":false,"update":false,"delete":false,"approve":false}
    }'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    'Support Agent',
    'Read-only access to drivers, rides, and riders. Full access to support tickets.',
    '{
      "dashboard":     {"create":false,"read":true, "update":false,"delete":false,"approve":false},
      "drivers":       {"create":false,"read":true, "update":false,"delete":false,"approve":false},
      "rides":         {"create":false,"read":true, "update":false,"delete":false,"approve":false},
      "riders":        {"create":false,"read":true, "update":false,"delete":false,"approve":false},
      "subscriptions": {"create":false,"read":false,"update":false,"delete":false,"approve":false},
      "pricing":       {"create":false,"read":false,"update":false,"delete":false,"approve":false},
      "support":       {"create":true, "read":true, "update":true, "delete":false,"approve":true},
      "reports":       {"create":false,"read":false,"update":false,"delete":false,"approve":false},
      "settings":      {"create":false,"read":false,"update":false,"delete":false,"approve":false}
    }'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Finance Viewer',
    'Read-only access to subscriptions, payments, and financial reports.',
    '{
      "dashboard":     {"create":false,"read":true, "update":false,"delete":false,"approve":false},
      "drivers":       {"create":false,"read":false,"update":false,"delete":false,"approve":false},
      "rides":         {"create":false,"read":false,"update":false,"delete":false,"approve":false},
      "riders":        {"create":false,"read":false,"update":false,"delete":false,"approve":false},
      "subscriptions": {"create":false,"read":true, "update":false,"delete":false,"approve":false},
      "pricing":       {"create":false,"read":false,"update":false,"delete":false,"approve":false},
      "support":       {"create":false,"read":false,"update":false,"delete":false,"approve":false},
      "reports":       {"create":false,"read":true, "update":false,"delete":false,"approve":false},
      "settings":      {"create":false,"read":false,"update":false,"delete":false,"approve":false}
    }'
  )
ON CONFLICT (id) DO NOTHING;

-- System Config defaults
INSERT INTO system_config (key, value, description) VALUES
  ('default_commission_rate', '0.20', 'Default commission rate for non-subscribers (20%)'),
  ('pending_approval_alert_threshold', '1', 'Alert when pending drivers >= this number'),
  ('expired_subs_alert_threshold', '1', 'Alert when expired subscriptions >= this number'),
  ('auto_suspend_complaint_count', '5', 'Auto-suspend driver when complaints reach this count'),
  ('churn_inactivity_days', '30', 'Days of inactivity before marking driver as churned');
