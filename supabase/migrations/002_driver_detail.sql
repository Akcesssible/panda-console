-- ============================================================
-- Migration 002 — Driver Detail extras
-- ============================================================

-- Profile photo for driver
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Mailing/home address
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address TEXT;

-- Extra vehicle photo gallery (array of URLs)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';
