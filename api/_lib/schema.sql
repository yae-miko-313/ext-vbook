-- VBook Registry Schema (Supabase)
-- V1.1: Idempotent Setup

-- Create a table for the extension manifests (Shelves) if not already there
CREATE TABLE IF NOT EXISTS manifests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL, 
    
    title VARCHAR(100) NOT NULL,
    author VARCHAR(100) NOT NULL,
    description TEXT,
    
    extension_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    secret_token UUID NOT NULL DEFAULT gen_random_uuid(),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices (CREATE INDEX doesn't support IF NOT EXISTS in all Postgres versions easily, 
-- but we can use DO blocks or just assume they are there)
DROP INDEX IF EXISTS idx_manifests_slug;
CREATE INDEX idx_manifests_slug ON manifests(slug);

DROP INDEX IF EXISTS idx_manifests_marketplace;
CREATE INDEX idx_manifests_marketplace ON manifests(usage_count DESC, updated_at DESC)
WHERE is_public = true;

-- Function to auto-update the `updated_at` column
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger (Only create if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp') THEN
        CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON manifests
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_updated_at();
    END IF;
END $$;

-- Function to atomically increment usage
CREATE OR REPLACE FUNCTION increment_usage(manifest_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE manifests 
  SET usage_count = usage_count + 1,
      last_accessed_at = NOW()
  WHERE id = manifest_id;
END;
$$ LANGUAGE plpgsql;

-- Comment: 
-- GC Logic (Garbage Collection):
-- 1. If NO ONE (no user app, no owner) access/fetches the link for 30 days -> Freeze it
--    Note: Every time a VBook app fetches the JSON, `last_accessed_at` is updated.
--    As long as 1 person still has this link in their VBook app, it STAYS ACTIVE.
--    UPDATE manifests SET status = 'frozen' WHERE status = 'active' AND last_accessed_at < NOW() - INTERVAL '30 days';
-- 2. If it remains frozen for another 7 days without the owner editing/unfreezing it -> Delete it
--    DELETE FROM manifests WHERE status = 'frozen' AND last_accessed_at < NOW() - INTERVAL '37 days';
