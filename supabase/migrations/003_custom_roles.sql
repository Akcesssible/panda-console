-- ============================================================
-- Migration 003 — Custom Roles
-- ============================================================

CREATE TABLE IF NOT EXISTS custom_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_by  UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_roles_name ON custom_roles(name);
