-- ============================================================
-- Migration 005 — Add is_active to custom_roles
-- ============================================================

ALTER TABLE custom_roles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
