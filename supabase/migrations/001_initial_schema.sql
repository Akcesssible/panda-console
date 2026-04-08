-- ============================================================
-- Panda Console — Initial Schema Migration
-- ============================================================

-- ENUMS
CREATE TYPE driver_status AS ENUM ('pending', 'active', 'suspended', 'churned');
CREATE TYPE vehicle_type AS ENUM ('bodaboda', 'bajaj', 'car');
CREATE TYPE ride_status AS ENUM ('requested', 'accepted', 'ongoing', 'completed', 'cancelled');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'grace_period');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_type AS ENUM ('fare_dispute', 'driver_complaint', 'rider_complaint', 'technical', 'other');
CREATE TYPE resolution_action AS ENUM ('fare_adjusted', 'refund_issued', 'driver_warned', 'driver_suspended', 'closed_no_action');
CREATE TYPE admin_role AS ENUM ('super_admin', 'ops_admin', 'support_agent', 'finance_viewer');
CREATE TYPE pricing_entity_type AS ENUM ('city', 'zone', 'vehicle_type');

-- ============================================================
-- ZONES (must come before drivers and pricing_rules)
-- ============================================================
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Dar es Salaam',
  is_active BOOLEAN DEFAULT true,
  boundary JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_zones_city ON zones(city);

-- ============================================================
-- ADMIN USERS
-- ============================================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role admin_role NOT NULL DEFAULT 'support_agent',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_auth ON admin_users(auth_id);

-- ============================================================
-- DRIVERS
-- ============================================================
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE NOT NULL,
  date_of_birth DATE,
  national_id TEXT UNIQUE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  status driver_status NOT NULL DEFAULT 'pending',
  zone_id UUID REFERENCES zones(id),
  rating NUMERIC(3,2) DEFAULT 5.0,
  total_trips INT DEFAULT 0,
  completed_trips INT DEFAULT 0,
  cancelled_trips INT DEFAULT 0,
  complaints_count INT DEFAULT 0,
  churn_reason TEXT,
  suspended_reason TEXT,
  suspended_at TIMESTAMPTZ,
  suspended_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES admin_users(id),
  last_active_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_zone ON drivers(zone_id);
CREATE INDEX idx_drivers_phone ON drivers(phone);
CREATE INDEX idx_drivers_number ON drivers(driver_number);

-- ============================================================
-- VEHICLES
-- ============================================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT,
  color TEXT,
  engine_cc INT,
  license_plate TEXT UNIQUE NOT NULL,
  owner_name TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  is_verified BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vehicles_driver ON vehicles(driver_id);

-- ============================================================
-- DRIVER DOCUMENTS
-- ============================================================
CREATE TABLE driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES admin_users(id),
  verified_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_docs_driver ON driver_documents(driver_id);

-- ============================================================
-- SUBSCRIPTION PLANS
-- ============================================================
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  duration_days INT NOT NULL,
  price_tzs NUMERIC(12,2) NOT NULL,
  vehicle_types vehicle_type[] DEFAULT '{bodaboda,bajaj,car}',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DRIVER SUBSCRIPTIONS
-- ============================================================
CREATE TABLE driver_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status subscription_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  grace_ends_at TIMESTAMPTZ,
  rides_remaining INT,
  assigned_by UUID REFERENCES admin_users(id),
  revoked_by UUID REFERENCES admin_users(id),
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subs_driver ON driver_subscriptions(driver_id);
CREATE INDEX idx_subs_status ON driver_subscriptions(status);
CREATE INDEX idx_subs_expires ON driver_subscriptions(expires_at);

-- ============================================================
-- SUBSCRIPTION PAYMENTS
-- ============================================================
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  subscription_id UUID REFERENCES driver_subscriptions(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  amount_tzs NUMERIC(12,2) NOT NULL,
  payment_method TEXT DEFAULT 'mobile_money',
  phone_used TEXT,
  provider TEXT,
  transaction_ref TEXT,
  status payment_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_driver ON subscription_payments(driver_id);
CREATE INDEX idx_payments_status ON subscription_payments(status);

-- ============================================================
-- PRICING RULES
-- ============================================================
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vehicle_type vehicle_type,
  zone_id UUID REFERENCES zones(id),
  city TEXT,
  base_fare_tzs NUMERIC(10,2) NOT NULL,
  per_km_rate_tzs NUMERIC(10,2) NOT NULL,
  per_minute_rate NUMERIC(10,2) DEFAULT 0,
  minimum_fare_tzs NUMERIC(10,2),
  peak_multiplier NUMERIC(4,2) DEFAULT 1.0,
  peak_start_time TIME,
  peak_end_time TIME,
  peak_days INT[],
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  effective_from TIMESTAMPTZ DEFAULT now(),
  effective_until TIMESTAMPTZ,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pricing_vehicle ON pricing_rules(vehicle_type);
CREATE INDEX idx_pricing_zone ON pricing_rules(zone_id);
CREATE INDEX idx_pricing_active ON pricing_rules(is_active);

-- ============================================================
-- RIDES
-- ============================================================
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_number TEXT UNIQUE NOT NULL,
  driver_id UUID REFERENCES drivers(id),
  rider_phone TEXT NOT NULL,
  rider_name TEXT,
  vehicle_type vehicle_type NOT NULL,
  zone_id UUID REFERENCES zones(id),
  pricing_rule_id UUID REFERENCES pricing_rules(id),
  status ride_status NOT NULL DEFAULT 'requested',
  pickup_address TEXT NOT NULL,
  pickup_lat NUMERIC(10,7),
  pickup_lng NUMERIC(10,7),
  destination_address TEXT NOT NULL,
  destination_lat NUMERIC(10,7),
  destination_lng NUMERIC(10,7),
  distance_km NUMERIC(8,3),
  duration_minutes INT,
  base_fare_tzs NUMERIC(10,2),
  distance_fare_tzs NUMERIC(10,2),
  time_fare_tzs NUMERIC(10,2),
  peak_multiplier NUMERIC(4,2) DEFAULT 1.0,
  total_fare_tzs NUMERIC(10,2),
  commission_rate NUMERIC(5,4) DEFAULT 0,
  commission_tzs NUMERIC(10,2) DEFAULT 0,
  driver_earnings_tzs NUMERIC(10,2),
  is_subscriber_ride BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  cancelled_by TEXT,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rides_driver ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_zone ON rides(zone_id);
CREATE INDEX idx_rides_requested ON rides(requested_at DESC);
CREATE INDEX idx_rides_flagged ON rides(is_flagged) WHERE is_flagged = true;

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  type ticket_type NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  reporter_type TEXT NOT NULL,
  driver_id UUID REFERENCES drivers(id),
  ride_id UUID REFERENCES rides(id),
  assigned_to UUID REFERENCES admin_users(id),
  resolution_action resolution_action,
  resolution_note TEXT,
  fare_adjusted_tzs NUMERIC(10,2),
  refund_amount_tzs NUMERIC(10,2),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_driver ON support_tickets(driver_id);
CREATE INDEX idx_tickets_ride ON support_tickets(ride_id);

-- ============================================================
-- TICKET MESSAGES
-- ============================================================
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  sender_id UUID REFERENCES admin_users(id),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_msgs_ticket ON ticket_messages(ticket_id);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id),
  admin_email TEXT NOT NULL,
  admin_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================
-- SYSTEM CONFIG (notification rules, thresholds)
-- ============================================================
CREATE TABLE system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (admin access only via service_role)
-- ============================================================
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS — all admin access happens via server-side service_role client
-- Anon key (browser) has no direct table access
CREATE POLICY "No anon access" ON drivers FOR ALL TO anon USING (false);
CREATE POLICY "No anon access" ON rides FOR ALL TO anon USING (false);
CREATE POLICY "No anon access" ON audit_logs FOR ALL TO anon USING (false);
