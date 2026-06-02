-- Migration 017: Add AI summary columns to trackers
-- Summary is generated once by the system and served to all users.

ALTER TABLE trackers ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE trackers ADD COLUMN IF NOT EXISTS summary_generated_at TIMESTAMPTZ;

-- Record this migration
INSERT INTO schema_migrations (version, applied_at)
VALUES ('017', NOW())
ON CONFLICT (version) DO NOTHING;
