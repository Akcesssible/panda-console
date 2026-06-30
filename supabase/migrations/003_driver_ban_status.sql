-- ============================================================
-- Migration 003 — Driver ban tracking
-- ============================================================

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS banned_reason TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES admin_users(id);

CREATE INDEX IF NOT EXISTS idx_drivers_banned_at ON drivers(banned_at);
