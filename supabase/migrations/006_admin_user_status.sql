-- ============================================================
-- Migration 006 — Admin User Status Lifecycle
-- ============================================================
-- Adds a status column to admin_users tracking the full
-- lifecycle: invited → active → logged_out → deactivated

CREATE TYPE admin_user_status AS ENUM (
  'invited',      -- account created, never logged in
  'active',       -- logged in at least once, currently active session
  'logged_out',   -- explicitly logged out
  'deactivated'   -- super_admin has deactivated the account
);

ALTER TABLE admin_users
  ADD COLUMN status admin_user_status NOT NULL DEFAULT 'invited';

-- Backfill: existing active rows → 'active', inactive rows → 'deactivated'
UPDATE admin_users SET status = 'deactivated' WHERE is_active = false;
UPDATE admin_users SET status = 'active'      WHERE is_active = true;

CREATE INDEX idx_admin_users_status ON admin_users(status);
