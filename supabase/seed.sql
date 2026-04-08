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

-- System Config defaults
INSERT INTO system_config (key, value, description) VALUES
  ('default_commission_rate', '0.20', 'Default commission rate for non-subscribers (20%)'),
  ('pending_approval_alert_threshold', '1', 'Alert when pending drivers >= this number'),
  ('expired_subs_alert_threshold', '1', 'Alert when expired subscriptions >= this number'),
  ('auto_suspend_complaint_count', '5', 'Auto-suspend driver when complaints reach this count'),
  ('churn_inactivity_days', '30', 'Days of inactivity before marking driver as churned');
